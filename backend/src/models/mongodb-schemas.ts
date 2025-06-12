import { MongoClient, Db, Collection } from 'mongodb';
import { mongoManager } from '../lib/mongodb-connection'; // Use the robust singleton connection manager

// ========== NATIVE MONGODB INTERFACES ==========
// These are plain TypeScript interfaces, not ORM/ODM schemas

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
  _id: string; // arena_id from SQL
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
  _id: string; // concert_id from SQL
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
  _id: string; // ticket_id from SQL
  fan_id: string;
  concert_id: string;
  arena_id: string;
  zone_name: string;
  purchase_date: Date;
  referral_code_used: boolean;
  concert_date: Date;
  fan_username: string;
  price: number;
}

// ========== NATIVE MONGODB CONNECTION ==========
let client: MongoClient;
let db: Db;

export const connectMongoDB = async (): Promise<void> => {
  try {
    // Ensure the singleton client is connected
    await mongoManager.connect();

    // Cache for sync getters
    db = await mongoManager.getDatabase();
    // mongoManager exposes its client internally; cast to any to grab it for legacy code
    // Note: direct client usage should be avoided going forward.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - accessing private prop in rare case we still need it
    client = (mongoManager as any).client as MongoClient;

    console.log('Connected to MongoDB successfully (via mongoManager)');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

export const getDatabase = (): Db => {
  if (!db) {
    throw new Error('Database not connected. Call connectMongoDB() first.');
  }
  return db;
};

export const closeMongoDB = async (): Promise<void> => {
  await mongoManager.close();
  db = undefined as unknown as Db;
  client = undefined as unknown as MongoClient;
};

// ========== COLLECTION GETTERS ==========
export const getUsersCollection = (): Collection<IUser> => {
  const database = getDatabase();
  return database.collection<IUser>('users');
};

export const getArtistsCollection = (): Collection<IArtist> => {
  const database = getDatabase();
  return database.collection<IArtist>('artists');
};

export const getArenasCollection = (): Collection<IArena> => {
  const database = getDatabase();
  return database.collection<IArena>('arenas');
};

export const getConcertsCollection = (): Collection<IConcert> => {
  const database = getDatabase();
  return database.collection<IConcert>('concerts');
};

export const getTicketsCollection = (): Collection<ITicket> => {
  const database = getDatabase();
  return database.collection<ITicket>('tickets');
};

// ========== INDEX CREATION ==========
export const createIndexes = async (): Promise<void> => {
  try {
    const usersCol = getUsersCollection();
    const artistsCol = getArtistsCollection();
    const arenasCol = getArenasCollection();
    const concertsCol = getConcertsCollection();
    const ticketsCol = getTicketsCollection();

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
    // Compound index for common search pattern
    await concertsCol.createIndex({ concert_date: 1, arena_id: 1 });

    // Ticket indexes - optimized for fan queries and analytics
    await ticketsCol.createIndex({ fan_id: 1 });
    await ticketsCol.createIndex({ concert_id: 1 });
    await ticketsCol.createIndex({ purchase_date: 1 });
    await ticketsCol.createIndex({ concert_date: 1 });
    // Compound indexes for common query patterns
    await ticketsCol.createIndex({ fan_id: 1, concert_date: 1 });
    await ticketsCol.createIndex({ concert_id: 1, zone_name: 1 });

    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
    throw error;
  }
}; 