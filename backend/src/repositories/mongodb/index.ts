// src/repositories/mongodb/index.ts
// ========== MONGODB REPOSITORY IMPLEMENTATIONS ==========

import { 
  getUsersCollection,
  getArtistsCollection,
  getArenasCollection,
  getConcertsCollection,
  getTicketsCollection,
  IUser,
  IArtist,
  IArena,
  IConcert,
  ITicket
} from '../../models/mongodb-schemas';
import { mongoManager } from '../../lib/mongodb-connection';
import { 
  IUserRepository, 
  IArtistRepository,
  IArenaRepository,
  IConcertRepository,
  ITicketRepository,
  IRepositoryFactory 
} from '../interfaces';

export class MongoUserRepository implements IUserRepository {

  async findById(userId: string): Promise<any | null> {
    try {
      const collection = await mongoManager.getCollection<IUser>('users');
      const user = await collection.findOne({ _id: userId as any });
      return user;
    } catch (error) {
      console.error('Error in MongoUserRepository.findById:', error);
      return null;
    }
  }

  async findByEmail(email: string): Promise<any | null> {
    try {
      const collection = await mongoManager.getCollection<IUser>('users');
      const user = await collection.findOne({ email });
      return user || null;
    } catch (error) {
      console.error('Error in MongoUserRepository.findByEmail:', error);
      return null;
    }
  }

  async findFanByUsername(username: string): Promise<any | null> {
    try {
      const collection = await mongoManager.getCollection<IUser>('users');
      const user = await collection.findOne({ 
        user_type: 'fan',
        'fan_details.username': username 
      });
      return user || null;
    } catch (error) {
      console.error('Error in MongoUserRepository.findFanByUsername:', error);
      return null;
    }
  }

  async findFanByReferralCode(referralCode: string): Promise<any | null> {
    try {
      const collection = await mongoManager.getCollection<IUser>('users');
      const user = await collection.findOne({ 
        user_type: 'fan',
        'fan_details.referral_code': referralCode 
      });
      return user || null;
    } catch (error) {
      console.error('Error in MongoUserRepository.findFanByReferralCode:', error);
      return null;
    }
  }

  async create(userData: any): Promise<any> {
    try {
      const collection = await mongoManager.getCollection<IUser>('users');
      const result = await collection.insertOne(userData);
      return await collection.findOne({ _id: result.insertedId });
    } catch (error) {
      console.error('Error in MongoUserRepository.create:', error);
      throw error;
    }
  }

  async update(userId: string, updates: any): Promise<any | null> {
    try {
      const collection = await mongoManager.getCollection<IUser>('users');
      const result = await collection.findOneAndUpdate(
        { _id: userId as any },
        { $set: updates },
        { returnDocument: 'after' }
      );
      return result;
    } catch (error) {
      console.error('Error in MongoUserRepository.update:', error);
      return null;
    }
  }

  async delete(userId: string): Promise<boolean> {
    try {
      const collection = await mongoManager.getCollection<IUser>('users');
      const result = await collection.deleteOne({ _id: userId as any });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error in MongoUserRepository.delete:', error);
      return false;
    }
  }

  async updateReferralPoints(userId: string, points: number): Promise<void> {
    try {
      const collection = await mongoManager.getCollection<IUser>('users');
      await collection.updateOne(
        { _id: userId, user_type: 'fan' },
        { $inc: { 'fan_details.referral_points': points } }
      );
    } catch (error) {
      console.error('Error in MongoUserRepository.updateReferralPoints:', error);
      throw error;
    }
  }

  async markReferralCodeUsed(fanId: string): Promise<void> {
    try {
      const collection = await mongoManager.getCollection<IUser>('users');
      await collection.updateOne(
        { _id: fanId, user_type: 'fan' },
        { $set: { 'fan_details.referral_code_used': true } }
      );
    } catch (error) {
      console.error('Error in MongoUserRepository.markReferralCodeUsed:', error);
      throw error;
    }
  }

  async setReferrer(fanId: string, referrerId: string): Promise<void> {
    try {
      const collection = await mongoManager.getCollection<IUser>('users');
      await collection.updateOne(
        { _id: fanId, user_type: 'fan' },
        { $set: { 'fan_details.referred_by': referrerId } }
      );
    } catch (error) {
      console.error('Error in MongoUserRepository.setReferrer:', error);
      throw error;
    }
  }
}

export class MongoTicketRepository implements ITicketRepository {

  async findById(ticketId: string): Promise<any | null> {
    try {
      const collection = await mongoManager.getCollection<ITicket>('tickets');
      const ticket = await collection.findOne({ _id: ticketId as any });
      return ticket;
    } catch (error) {
      console.error('Error in MongoTicketRepository.findById:', error);
      return null;
    }
  }

  async findByFan(fanId: string): Promise<any[]> {
    try {
      const collection = await mongoManager.getCollection<ITicket>('tickets');
      const tickets = await collection.aggregate([
        // Stage 1: Match tickets for the given fan
        {
          $match: { fan_id: fanId }
        },
        // Stage 2: Lookup concert details
        {
          $lookup: {
            from: 'concerts',
            localField: 'concert_id',
            foreignField: '_id',
            as: 'concert_details'
          }
        },
        // Stage 3: Deconstruct the concert_details array
        {
          $unwind: {
            path: '$concert_details',
            preserveNullAndEmptyArrays: true // Keep ticket even if concert is not found
          }
        },
        // Stage 4: Lookup arena details from the concert's arena_id
        {
          $lookup: {
            from: 'arenas',
            localField: 'concert_details.arena_id',
            foreignField: '_id',
            as: 'arena_details'
          }
        },
        // Stage 5: Deconstruct the arena_details array
        {
          $unwind: {
            path: '$arena_details',
            preserveNullAndEmptyArrays: true // Keep ticket even if arena is not found
          }
        },
        // Stage 6: Project to shape the final output
        {
          $project: {
            _id: 1,
            fan_id: 1,
            concert_id: 1,
            arena_id: '$concert_details.arena_id', // Use the one from concert
            zone_name: 1,
            purchase_date: 1,
            purchase_price: 1,
            concert_name: '$concert_details.description',
            concert_date: '$concert_details.concert_date',
            concert_time: '$concert_details.time',
            arena_name: '$arena_details.arena_name',
            arena_location: '$arena_details.arena_location'
          }
        },
        // Stage 7: Sort by concert date
        {
          $sort: { concert_date: 1 }
        }
      ]).toArray();
      
      return tickets;
    } catch (error) {
      console.error('Error in MongoTicketRepository.findByFan:', error);
      return [];
    }
  }

  async findByConcert(concertId: string): Promise<any[]> {
    try {
      const collection = await mongoManager.getCollection<ITicket>('tickets');
      const tickets = await collection.find({ concert_id: concertId }).toArray();
      return tickets;
    } catch (error) {
      console.error('Error in MongoTicketRepository.findByConcert:', error);
      return [];
    }
  }

  async findByConcertAndZone(concertId: string, zoneName: string): Promise<any[]> {
    try {
      const collection = await mongoManager.getCollection<ITicket>('tickets');
      const tickets = await collection.find({ concert_id: concertId, zone_name: zoneName }).toArray();
      return tickets;
    } catch (error) {
      console.error('Error in MongoTicketRepository.findByConcertAndZone:', error);
      return [];
    }
  }

  async create(ticketData: any): Promise<any> {
    try {
      const collection = await mongoManager.getCollection<ITicket>('tickets');
      const result = await collection.insertOne(ticketData);
      return { ...ticketData, _id: result.insertedId };
    } catch (error) {
      console.error('Error in MongoTicketRepository.create:', error);
      throw error;
    }
  }

  async createMultiple(ticketsData: any[]): Promise<any[]> {
    try {
      const collection = await mongoManager.getCollection<ITicket>('tickets');
      const result = await collection.insertMany(ticketsData);
      // Combine inserted ids with original data
      return ticketsData.map((ticket, index) => ({
        ...ticket,
        _id: result.insertedIds[index]
      }));
    } catch (error) {
      console.error('Error in MongoTicketRepository.createMultiple:', error);
      throw error;
    }
  }

  async delete(ticketId: string): Promise<boolean> {
    try {
      const collection = await mongoManager.getCollection<ITicket>('tickets');
      const result = await collection.deleteOne({ _id: ticketId as any });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error in MongoTicketRepository.delete:', error);
      return false;
    }
  }

  async countByConcertAndZone(concertId: string, zoneName: string): Promise<number> {
    try {
      const collection = await mongoManager.getCollection<ITicket>('tickets');
      const count = await collection.countDocuments({ concert_id: concertId, zone_name: zoneName });
      return count;
    } catch (error) {
      console.error('Error in MongoTicketRepository.countByConcertAndZone:', error);
      return 0;
    }
  }
}

export class MongoArtistRepository implements IArtistRepository {

  async findById(artistId: string): Promise<any | null> {
    try {
      const collection = await mongoManager.getCollection<IArtist>('artists');
      const artist = await collection.findOne({ _id: artistId as any });
      return artist;
    } catch (error) {
      console.error('Error in MongoArtistRepository.findById:', error);
      return null;
    }
  }

  async findAll(): Promise<any[]> {
    try {
      const collection = await mongoManager.getCollection<IArtist>('artists');
      const artists = await collection.find({}).toArray();
      return artists;
    } catch (error) {
      console.error('Error in MongoArtistRepository.findAll:', error);
      return [];
    }
  }

  async findByGenre(genre: string): Promise<any[]> {
    try {
      const collection = await mongoManager.getCollection<IArtist>('artists');
      const artists = await collection
        .find({ genre })
        .sort({ artist_name: 1 })
        .toArray();
      return artists;
    } catch (error) {
      console.error('Error in MongoArtistRepository.findByGenre:', error);
      return [];
    }
  }

  async create(artistData: any): Promise<any> {
    try {
      const collection = await mongoManager.getCollection<IArtist>('artists');
      const result = await collection.insertOne(artistData);
      return { ...artistData, _id: result.insertedId };
    } catch (error) {
      console.error('Error in MongoArtistRepository.create:', error);
      throw error;
    }
  }

  async update(artistId: string, updates: Partial<IArtist>): Promise<any | null> {
    try {
      const collection = await mongoManager.getCollection<IArtist>('artists');
      const result = await collection.findOneAndUpdate(
        { _id: artistId as any },
        { $set: updates },
        { returnDocument: 'after' }
      );
      return result;
    } catch (error) {
      console.error('Error in MongoArtistRepository.update:', error);
      return null;
    }
  }

  async delete(artistId: string): Promise<boolean> {
    try {
      const collection = await mongoManager.getCollection<IArtist>('artists');
      const result = await collection.deleteOne({ _id: artistId as any });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error in MongoArtistRepository.delete:', error);
      return false;
    }
  }
}

export class MongoArenaRepository implements IArenaRepository {

  async findById(arenaId: string): Promise<any | null> {
    try {
      const collection = await mongoManager.getCollection<IArena>('arenas');
      const arena = await collection.findOne({ _id: arenaId as any });
      return arena;
    } catch (error) {
      console.error('Error in MongoArenaRepository.findById:', error);
      return null;
    }
  }

  async findAll(): Promise<any[]> {
    try {
      const collection = await mongoManager.getCollection<IArena>('arenas');
      const arenas = await collection.find({}).toArray();
      return arenas;
    } catch (error) {
      console.error('Error in MongoArenaRepository.findAll:', error);
      return [];
    }
  }

  async findByLocation(location: string): Promise<any[]> {
    try {
      const collection = await mongoManager.getCollection<IArena>('arenas');
      const arenas = await collection
        .find({ arena_location: { $regex: location, $options: 'i' } })
        .sort({ arena_name: 1 })
        .toArray();
      return arenas;
    } catch (error) {
      console.error('Error in MongoArenaRepository.findByLocation:', error);
      return [];
    }
  }

  async findZones(arenaId: string): Promise<any[]> {
    try {
      const collection = await mongoManager.getCollection<IArena>('arenas');
      const arena = await collection.findOne({ _id: arenaId });
      return arena?.zones || [];
    } catch (error) {
      console.error('Error in MongoArenaRepository.findZones:', error);
      return [];
    }
  }

  async create(arenaData: any): Promise<any> {
    try {
      const collection = await mongoManager.getCollection<IArena>('arenas');
      const result = await collection.insertOne(arenaData);
      return { ...arenaData, _id: result.insertedId };
    } catch (error) {
      console.error('Error in MongoArenaRepository.create:', error);
      throw error;
    }
  }

  async update(arenaId: string, updates: Partial<IArena>): Promise<any | null> {
    try {
      const collection = await mongoManager.getCollection<IArena>('arenas');
      const result = await collection.findOneAndUpdate(
        { _id: arenaId as any },
        { $set: updates },
        { returnDocument: 'after' }
      );
      return result;
    } catch (error) {
      console.error('Error in MongoArenaRepository.update:', error);
      return null;
    }
  }

  async delete(arenaId: string): Promise<boolean> {
    try {
      const collection = await mongoManager.getCollection<IArena>('arenas');
      const result = await collection.deleteOne({ _id: arenaId as any });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error in MongoArenaRepository.delete:', error);
      return false;
    }
  }
}

export class MongoConcertRepository implements IConcertRepository {

  async findById(concertId: string): Promise<any | null> {
    try {
      const collection = await mongoManager.getCollection<IConcert>('concerts');
      const concert = await collection.findOne({ _id: concertId as any });
      return concert;
    } catch (error) {
      console.error('Error in MongoConcertRepository.findById:', error);
      return null;
    }
  }

  async findAll(): Promise<any[]> {
    try {
      const collection = await mongoManager.getCollection<IConcert>('concerts');
      const concerts = await collection.aggregate([
        {
          $lookup: {
            from: 'arenas',
            localField: 'arena_id',
            foreignField: '_id',
            as: 'arena'
          }
        },
        {
          $unwind: {
            path: '$arena',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            concert_date: 1,
            time: 1,
            description: 1,
            organizer_id: 1,
            arena_id: 1,
            artists: 1,
            zone_pricing: 1,
            arena_name: '$arena.arena_name',
            arena_location: '$arena.arena_location'
          }
        }
      ]).toArray();
      return concerts;
    } catch (error) {
      console.error('Error in MongoConcertRepository.findAll:', error);
      // Return empty array if MongoDB is not connected
      return [];
    }
  }

  async findByDate(date: Date): Promise<any[]> {
    try {
      const collection = await mongoManager.getCollection<IConcert>('concerts');
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const concerts = await collection
        .find({ 
          concert_date: { 
            $gte: startOfDay, 
            $lte: endOfDay 
          } 
        })
        .sort({ time: 1 })
        .toArray();
      return concerts;
    } catch (error) {
      console.error('Error in MongoConcertRepository.findByDate:', error);
      return [];
    }
  }

  async findByOrganizer(organizerId: string): Promise<any[]> {
    try {
      const collection = await mongoManager.getCollection<IConcert>('concerts');
      const concerts = await collection
        .find({ organizer_id: organizerId })
        .sort({ concert_date: 1 })
        .toArray();
      return concerts;
    } catch (error) {
      console.error('Error in MongoConcertRepository.findByOrganizer:', error);
      return [];
    }
  }

  async findByArtist(artistId: string): Promise<any[]> {
    try {
      const collection = await mongoManager.getCollection<IConcert>('concerts');
      const concerts = await collection
        .find({ 'artists.artist_id': artistId })
        .sort({ concert_date: 1 })
        .toArray();
      return concerts;
    } catch (error) {
      console.error('Error in MongoConcertRepository.findByArtist:', error);
      return [];
    }
  }

  async create(concertData: any): Promise<any> {
    try {
      const collection = await mongoManager.getCollection<IConcert>('concerts');
      const result = await collection.insertOne(concertData);
      return { ...concertData, _id: result.insertedId };
    } catch (error) {
      console.error('Error in MongoConcertRepository.create:', error);
      throw error;
    }
  }

  async update(concertId: string, updates: Partial<IConcert>): Promise<any | null> {
    try {
      const collection = await mongoManager.getCollection<IConcert>('concerts');
      const result = await collection.findOneAndUpdate(
        { _id: concertId as any },
        { $set: updates },
        { returnDocument: 'after' }
      );
      return result;
    } catch (error) {
      console.error('Error in MongoConcertRepository.update:', error);
      return null;
    }
  }

  async delete(concertId: string): Promise<boolean> {
    try {
      const collection = await mongoManager.getCollection<IConcert>('concerts');
      const result = await collection.deleteOne({ _id: concertId as any });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error in MongoConcertRepository.delete:', error);
      return false;
    }
  }

  async findZonePricing(concertId: string, arenaId: string, zoneName: string): Promise<any | null> {
    try {
      const collection = await mongoManager.getCollection<IConcert>('concerts');
      const concert = await collection.findOne({ _id: concertId });
      if (!concert || !concert.zone_pricing) return null;
      
      const zonePrice = concert.zone_pricing.find((pricing: any) => pricing.zone_name === zoneName);
      return zonePrice ? { ...zonePrice, arena_id: arenaId } : null;
    } catch (error) {
      console.error('Error in MongoConcertRepository.findZonePricing:', error);
      return null;
    }
  }

  async findAvailableTickets(concertId: string, zoneName: string): Promise<number> {
    try {
      // Get concert to find arena and zone capacity
      const concertsCollection = await mongoManager.getCollection<IConcert>('concerts');
      const concert = await concertsCollection.findOne({ _id: concertId });
      if (!concert) return 0;
      
      // Get arena to find zone capacity
      const arenasCollection = await mongoManager.getCollection<IArena>('arenas');
      const arena = await arenasCollection.findOne({ _id: concert.arena_id });
      if (!arena || !arena.zones) return 0;
      
      const zone = arena.zones.find((z: any) => z.zone_name === zoneName);
      if (!zone) return 0;
      
      const capacity = zone.capacity_per_zone;
      
      // Count sold tickets
      const ticketsCollection = await mongoManager.getCollection<ITicket>('tickets');
      const soldCount = await ticketsCollection.countDocuments({
        concert_id: concertId,
        zone_name: zoneName
      });
      
      return capacity - soldCount;
    } catch (error) {
      console.error('Error in MongoConcertRepository.findAvailableTickets:', error);
      return 0;
    }
  }
}

export class MongoRepositoryFactory implements IRepositoryFactory {
  private userRepository: MongoUserRepository;
  private artistRepository: MongoArtistRepository;
  private arenaRepository: MongoArenaRepository;
  private concertRepository: MongoConcertRepository;
  private ticketRepository: MongoTicketRepository;

  constructor() {
    this.userRepository = new MongoUserRepository();
    this.artistRepository = new MongoArtistRepository();
    this.arenaRepository = new MongoArenaRepository();
    this.concertRepository = new MongoConcertRepository();
    this.ticketRepository = new MongoTicketRepository();
  }

  getUserRepository(): IUserRepository {
    return this.userRepository;
  }

  getArtistRepository(): IArtistRepository {
    return this.artistRepository;
  }

  getArenaRepository(): IArenaRepository {
    return this.arenaRepository;
  }

  getConcertRepository(): IConcertRepository {
    return this.concertRepository;
  }

  getTicketRepository(): ITicketRepository {
    return this.ticketRepository;
  }
} 