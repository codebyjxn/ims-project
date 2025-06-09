import mongoose, { Schema, Document } from 'mongoose';

// ========== USERS COLLECTION ==========
// Optimized: Keep user types together but optimize for query patterns
export interface IUser extends Document {
  _id: string; // user_id from SQL
  email: string;
  user_password: string;
  first_name: string;
  last_name: string;
  registration_date: Date;
  last_login?: Date;
  user_type: 'fan' | 'organizer';
  
  // Fan-specific fields (only when user_type = 'fan')
  fan_details?: {
    username: string;
    preferred_genre: string;
    phone_number: string;
    referral_code: string;
    referred_by?: string; // Reference to referrer's user_id
    referral_points: number;
    referral_code_used: boolean;
  };
  
  // Organizer-specific fields (only when user_type = 'organizer')
  organizer_details?: {
    organization_name: string;
    contact_info: string;
  };
}

const UserSchema = new Schema<IUser>({
  _id: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  user_password: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  registration_date: { type: Date, default: Date.now },
  last_login: Date,
  user_type: { type: String, enum: ['fan', 'organizer'], required: true },
  
  fan_details: {
    username: { type: String, unique: true, sparse: true },
    preferred_genre: String,
    phone_number: String,
    referral_code: { type: String, unique: true, sparse: true },
    referred_by: String,
    referral_points: { type: Number, default: 0 },
    referral_code_used: { type: Boolean, default: false }
  },

  organizer_details: {
    organization_name: String,
    contact_info: String
  }
}, { 
  _id: false,
  versionKey: false
});

// ========== ARTISTS COLLECTION ==========
// Simplified: Only core artist data
export interface IArtist extends Document {
  _id: string; // artist_id from SQL
  artist_name: string;
  genre: string;
}

const ArtistSchema = new Schema<IArtist>({
  _id: { type: String, required: true },
  artist_name: { type: String, required: true },
  genre: String
}, { 
  _id: false,
  versionKey: false
});

// ========== ARENAS COLLECTION ==========
// Optimized: Embed zones for better performance on concert queries
export interface IArena extends Document {
  _id: string; // arena_id from SQL
  arena_name: string;
  arena_location: string;
  total_capacity: number;
  
  // Embed zones for better query performance
  zones: Array<{
    zone_name: string;
    capacity_per_zone: number;
  }>;
}

const ArenaSchema = new Schema<IArena>({
  _id: { type: String, required: true },
  arena_name: { type: String, required: true },
  arena_location: String,
  total_capacity: Number,
  
  zones: [{
    zone_name: { type: String, required: true },
    capacity_per_zone: { type: Number, required: true }
  }]
}, { 
  _id: false,
  versionKey: false
});

// ========== CONCERTS COLLECTION ==========
// Optimized: Denormalize frequently accessed data, reference rarely accessed
export interface IConcert extends Document {
  _id: string; // concert_id from SQL
  concert_date: Date;
  time: string; // concert time
  description: string;
  
  // Reference to organizer (not embedded - organizer data rarely changes)
  organizer_id: string;
  
  // Reference to arena (not embedded - arena data rarely changes)
  arena_id: string;
  
  // Embed artist IDs and names for quick access (small, frequently accessed)
  artists: Array<{
    artist_id: string;
    artist_name: string;
    genre: string;
  }>;
  
  // Embed zone pricing for quick ticket purchase queries
  zone_pricing: Array<{
    zone_name: string;
    price: number;
  }>;
}

const ConcertSchema = new Schema<IConcert>({
  _id: { type: String, required: true },
  concert_date: { type: Date, required: true },
  time: String,
  description: String,
  organizer_id: { type: String, required: true },
  arena_id: { type: String, required: true },
  
  artists: [{
    artist_id: { type: String, required: true },
    artist_name: { type: String, required: true },
    genre: String
  }],
  
  zone_pricing: [{
    zone_name: { type: String, required: true },
    price: { type: Number, required: true }
  }]
}, { 
  _id: false,
  versionKey: false
});

// ========== TICKETS COLLECTION ==========
// Optimized: Minimal denormalization, focus on transaction efficiency
export interface ITicket extends Document {
  _id: string; // ticket_id from SQL
  fan_id: string;
  concert_id: string;
  arena_id: string;
  zone_name: string;
  purchase_date: Date;
  referral_code_used: boolean;
  
  // Denormalize only essential data for common queries
  concert_date: Date; // For date-based queries
  fan_username: string; // For fan ticket lookup
  price: number; // From concert_zone_pricing
}

const TicketSchema = new Schema<ITicket>({
  _id: { type: String, required: true },
  fan_id: { type: String, required: true },
  concert_id: { type: String, required: true },
  arena_id: { type: String, required: true },
  zone_name: { type: String, required: true },
  purchase_date: { type: Date, default: Date.now },
  referral_code_used: { type: Boolean, default: false },
  
  // Denormalized for query performance
  concert_date: { type: Date, required: true },
  fan_username: { type: String, required: true },
  price: { type: Number, required: true }
}, { 
  _id: false,
  versionKey: false
});

// Export models
export const UserModel = mongoose.model<IUser>('User', UserSchema);
export const ArtistModel = mongoose.model<IArtist>('Artist', ArtistSchema);
export const ArenaModel = mongoose.model<IArena>('Arena', ArenaSchema);
export const ConcertModel = mongoose.model<IConcert>('Concert', ConcertSchema);
export const TicketModel = mongoose.model<ITicket>('Ticket', TicketSchema);

// Optimized indexes for common query patterns
export const createIndexes = async (): Promise<void> => {
  try {
    // User indexes - optimized for authentication and fan lookups
    await UserModel.collection.createIndex({ email: 1 });
    await UserModel.collection.createIndex({ user_type: 1 });
    await UserModel.collection.createIndex({ 'fan_details.username': 1 });
    await UserModel.collection.createIndex({ 'fan_details.preferred_genre': 1 });
    await UserModel.collection.createIndex({ 'fan_details.referral_code': 1 });

    // Artist indexes - optimized for genre searches
    await ArtistModel.collection.createIndex({ genre: 1 });
    await ArtistModel.collection.createIndex({ artist_name: 1 });

    // Arena indexes - optimized for location searches
    await ArenaModel.collection.createIndex({ arena_location: 1 });

    // Concert indexes - optimized for date and location searches
    await ConcertModel.collection.createIndex({ concert_date: 1 });
    await ConcertModel.collection.createIndex({ organizer_id: 1 });
    await ConcertModel.collection.createIndex({ arena_id: 1 });
    await ConcertModel.collection.createIndex({ 'artists.genre': 1 });
    // Compound index for common search pattern
    await ConcertModel.collection.createIndex({ concert_date: 1, arena_id: 1 });

    // Ticket indexes - optimized for fan queries and analytics
    await TicketModel.collection.createIndex({ fan_id: 1 });
    await TicketModel.collection.createIndex({ concert_id: 1 });
    await TicketModel.collection.createIndex({ purchase_date: 1 });
    await TicketModel.collection.createIndex({ concert_date: 1 });
    // Compound indexes for common query patterns
    await TicketModel.collection.createIndex({ fan_id: 1, concert_date: 1 });
    await TicketModel.collection.createIndex({ concert_id: 1, zone_name: 1 });

    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
    throw error;
  }
}; 