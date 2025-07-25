import { Collection, ObjectId } from 'mongodb';
import { mongoManager } from '../lib/mongodb-connection'; // Use the robust singleton connection manager

// ========== NATIVE MONGODB INTERFACES ==========
// These are plain TypeScript interfaces
// Users Collection Interface
export interface IUser {
  _id: string; // user_id from SQL
  email: string;
  user_password: string;
  first_name: string;
  last_name: string;
  registration_date: Date;
  last_login?: Date;
  user_type: 'fan' | 'organizer' | 'admin';
  
  // Fan-specific fields (only when user_type = 'fan')
  fan_details?: {
    username: string;
    preferred_genre: string;
    phone_number: string;
    referral_code: string;
    referred_by?: string;
    referral_points: number;
    referral_code_used: boolean;
  };
  
  // Organizer-specific fields (only when user_type = 'organizer')
  organizer_details?: {
    organization_name: string;
    contact_info: string;
  };
}

// Artists Collection Interface
export interface IArtist {
  _id: string; // artist_id from SQL
  artist_name: string;
  genre: string;
}

// Arenas Collection Interface
export interface IArena {
  _id: string; 
  arena_name: string;
  arena_location: string;
  total_capacity: number;
  zones: Array<{
    zone_name: string;
    capacity_per_zone: number;
  }>;
}

// Concerts Collection Interface
export interface IConcert {
  _id: string | ObjectId; 
  concert_date: Date;
  time: string;
  description: string;
  organizer_id: string;
  arena_id: string;
  artists: Array<{
    artist_id: string;
    artist_name: string;
    genre: string;
  }>;
  zone_pricing: Array<{
    zone_name: string;
    price: number;
  }>;
}

// Tickets Collection Interface
export interface ITicket {
  _id: string;
  fan_id: string;
  concert_id: string;
  arena_id: string;
  zone_name: string;
  purchase_date: Date;
  purchase_price: number;
  concert_date: Date;
  fan_username: string;

  // Optional denormalized fields from aggregations
  concert_name?: string;
  concert_time?: string;
  arena_name?: string;
  arena_location?: string;
}

export const getUsersCollection = async () => mongoManager.getCollection<IUser>('users');
export const getArtistsCollection = async () => mongoManager.getCollection<IArtist>('artists');
export const getArenasCollection = async () => mongoManager.getCollection<IArena>('arenas');
export const getConcertsCollection = async () => mongoManager.getCollection<IConcert>('concerts');
export const getTicketsCollection = async () => mongoManager.getCollection<ITicket>('tickets');

export const createIndexes = async (): Promise<void> => {
  try {
    const usersCol = await getUsersCollection();
    const artistsCol = await getArtistsCollection();
    const arenasCol = await getArenasCollection();
    const concertsCol = await getConcertsCollection();
    const ticketsCol = await getTicketsCollection();

    // User indexes - optimized for authentication and fan lookups
    await usersCol.createIndex({ email: 1 }, { unique: true });
    await usersCol.createIndex({ user_type: 1 });
    await usersCol.createIndex({ 'fan_details.username': 1 }, { sparse: true, unique: true });
    await usersCol.createIndex({ 'fan_details.preferred_genre': 1 });
    await usersCol.createIndex({ 'fan_details.referral_code': 1 }, { sparse: true, unique: true });

    // Artist indexes - optimized for genre searches
    await artistsCol.createIndex({ genre: 1 });
    await artistsCol.createIndex({ artist_name: 1 });

    // Arena indexes - optimized for location searches
    await arenasCol.createIndex({ arena_location: 1 });

    // Concert indexes - optimized for date and location searches
    await concertsCol.createIndex({ concert_date: 1 });
    await concertsCol.createIndex({ organizer_id: 1 });
    await concertsCol.createIndex({ arena_id: 1 });
    await concertsCol.createIndex({ 'artists.genre': 1 });
    await concertsCol.createIndex({ concert_date: 1, arena_id: 1 });

    // Ticket indexes - optimized for fan queries and analytics
    await ticketsCol.createIndex({ fan_id: 1 });
    await ticketsCol.createIndex({ concert_id: 1 });
    await ticketsCol.createIndex({ purchase_date: 1 });
    await ticketsCol.createIndex({ concert_date: 1 });
    await ticketsCol.createIndex({ fan_id: 1, concert_date: 1 });
    await ticketsCol.createIndex({ concert_id: 1, zone_name: 1 });

    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
    throw error;
  }
}; 