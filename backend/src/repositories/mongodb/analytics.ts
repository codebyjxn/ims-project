import { Collection, Db } from 'mongodb';
import { mongoManager } from '../../lib/mongodb-connection';
import { UpcomingConcertPerformance } from '../postgres/analytics'; // Re-using the same interface

export class MongoAnalyticsRepository {
  private ticketsCollection: Collection<any>;

  private constructor(db: Db) {
    this.ticketsCollection = db.collection('tickets');
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
      {
        $match: {
          concert_date: { $gte: today }
        }
      },
      {
        $lookup: {
          from: 'concerts',
          localField: 'concert_id',
          foreignField: '_id',
          as: 'concert_details'
        }
      },
      { $unwind: '$concert_details' },
      {
        $group: {
          _id: '$concert_id',
          concert_name: { $first: '$concert_name' },
          concert_date: { $first: '$concert_date' },
          description: { $first: '$concert_name' },
          arena_name: { $first: '$arena_name' },
          artists: { $first: '$concert_details.artists' },
          tickets_sold: { $sum: 1 },
          total_revenue: { $sum: { $ifNull: ['$purchase_price', 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          concert_id: '$_id',
          concert_name: 1,
          concert_date: { $dateToString: { format: "%Y-%m-%d", date: "$concert_date" } },
          description: '$concert_name',
          arena_name: 1,
          tickets_sold: 1,
          total_revenue: 1,
          artists: {
            $cond: [
              { $isArray: "$artists" },
              {
                $reduce: {
                  input: "$artists",
                  initialValue: "",
                  in: {
                    $cond: [
                      { $eq: ["$$value", ""] },
                      { $ifNull: ["$$this.artist_name", ""] },
                      {
                        $concat: ["$$value", ", ", { $ifNull: ["$$this.artist_name", ""] }]
                      }
                    ]
                  }
                }
              },
              ""
            ]
          }
        }
      },
      {
        $sort: {
          tickets_sold: -1
        }
      }
    ];

    const result = await this.ticketsCollection.aggregate(pipeline).toArray();
    return result as unknown as UpcomingConcertPerformance[];
  }
} 