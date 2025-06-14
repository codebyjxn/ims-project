import { Collection, Db } from 'mongodb';
import { mongoManager } from '../../lib/mongodb-connection';
import { UpcomingConcertPerformance } from '../postgres/analytics'; // Re-using the same interface

export class MongoAnalyticsRepository {
  private concertsCollection: Collection<any>;
  private ticketsCollection: Collection<any>;
  private arenasCollection: Collection<any>;

  private constructor(db: Db) {
    this.concertsCollection = db.collection('concerts');
    this.ticketsCollection = db.collection('tickets');
    this.arenasCollection = db.collection('arenas');
  }

  static async create(): Promise<MongoAnalyticsRepository> {
    const db = await mongoManager.getDatabase();
    if (!db) {
      throw new Error('Database not connected');
    }
    return new MongoAnalyticsRepository(db);
  }

  async getUpcomingConcertsPerformance(): Promise<UpcomingConcertPerformance[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pipeline = [
      // 1. Filter for upcoming concerts
      {
        $match: {
          concert_date: { $gte: today }
        }
      },
      // 2. Count tickets for each concert
      {
        $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: 'concert_id',
          as: 'sold_tickets'
        }
      },
      // 3. Get arena details
      {
        $lookup: {
          from: 'arenas',
          localField: 'arena_id',
          foreignField: '_id',
          as: 'arena_details'
        }
      },
      // 4. Project the desired fields
      {
        $project: {
          _id: 0,
          concert_id: '$_id',
          concert_name: '$description', // Assuming description is the name
          concert_date: { $dateToString: { format: "%Y-%m-%d", date: "$concert_date" } },
          description: '$description',
          arena_name: { $arrayElemAt: ['$arena_details.arena_name', 0] },
          artists: {
            $reduce: {
              input: '$artists.artist_name',
              initialValue: '',
              in: {
                $cond: {
                  if: { $eq: ['$$value', ''] },
                  then: '$$this',
                  else: { $concat: ['$$value', ', ', '$$this'] }
                }
              }
            }
          },
          tickets_sold: { $size: '$sold_tickets' }
        }
      },
      // 5. Sort by tickets sold
      {
        $sort: {
          tickets_sold: -1
        }
      }
    ];

    const result = await this.concertsCollection.aggregate(pipeline).toArray();
    return result as unknown as UpcomingConcertPerformance[];
  }
} 