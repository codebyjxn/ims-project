import mongoose, { Schema, Document } from 'mongoose';

// ========== USERS COLLECTION ==========
// Combines users, fans, and organizers with embedded details
export interface IUser extends Document {
  _id: string;
  email: string;
  user_password: string;
  first_name: string;
  last_name: string;
  user_type: 'fan' | 'organizer';
  
  // Fan-specific fields (embedded)
  fan_details?: {
    username: string;
    preferred_genre: string;
    phone_number: string;
    referral_points: number;
    referred_by?: string; // Reference to referrer's _id
    referrals: Array<{
      referred_user_id: string;
      referral_date: Date;
      points_awarded: number;
    }>;
  };
  
  // Organizer-specific fields (embedded)
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
  user_type: { type: String, enum: ['fan', 'organizer'], required: true },
  
  fan_details: {
    username: { type: String, unique: true, sparse: true },
    preferred_genre: String,
    phone_number: String,
    referral_points: { type: Number, default: 0 },
    referred_by: String,
    referrals: [{
      referred_user_id: String,
      referral_date: { type: Date, default: Date.now },
      points_awarded: { type: Number, default: 10 }
    }]
  },
  
  organizer_details: {
    organization_name: String,
    contact_info: String
  }
}, { 
  timestamps: true,
  _id: false // We'll use custom _id
});

// ========== CONCERTS COLLECTION ==========
// Heavily denormalized with embedded artist, arena, and zone information
export interface IConcert extends Document {
  _id: string;
  concert_date: Date;
  concert_time: string;
  description: string;
  
  // Organizer information (denormalized)
  organizer: {
    organizer_id: string;
    organization_name: string;
    contact_info: string;
  };
  
  // Arena information (denormalized)
  arena: {
    arena_id: string;
    arena_name: string;
    arena_location: string;
    total_capacity: number;
    zones: Array<{
      zone_name: string;
      capacity_per_zone: number;
      available_tickets: number;
    }>;
  };
  
  // Artists information (denormalized)
  artists: Array<{
    artist_id: string;
    artist_name: string;
    genre: string;
  }>;
  
  // Tickets sold (for analytics)
  tickets_sold: number;
  revenue: number;
}

const ConcertSchema = new Schema<IConcert>({
  _id: { type: String, required: true },
  concert_date: { type: Date, required: true },
  concert_time: { type: String, required: true },
  description: String,
  
  organizer: {
    organizer_id: { type: String, required: true },
    organization_name: { type: String, required: true },
    contact_info: String
  },
  
  arena: {
    arena_id: { type: String, required: true },
    arena_name: { type: String, required: true },
    arena_location: String,
    total_capacity: Number,
    zones: [{
      zone_name: { type: String, required: true },
      capacity_per_zone: { type: Number, required: true },
      available_tickets: { type: Number, required: true }
    }]
  },
  
  artists: [{
    artist_id: { type: String, required: true },
    artist_name: { type: String, required: true },
    genre: String
  }],
  
  tickets_sold: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 }
}, { 
  timestamps: true,
  _id: false
});

// ========== TICKETS COLLECTION ==========
// Denormalized with fan, concert, and arena details for fast queries
export interface ITicket extends Document {
  _id: string;
  purchase_date: Date;
  purchase_price: number;
  
  // Fan information (denormalized)
  fan: {
    fan_id: string;
    username: string;
    email: string;
    preferred_genre: string;
  };
  
  // Concert information (denormalized for analytics)
  concert: {
    concert_id: string;
    concert_date: Date;
    concert_time: string;
    description: string;
    organizer_name: string;
    arena_name: string;
    arena_location: string;
    artists: Array<{
      artist_name: string;
      genre: string;
    }>;
  };
  
  // Zone information
  zone: {
    zone_name: string;
    capacity_per_zone: number;
  };
}

const TicketSchema = new Schema<ITicket>({
  _id: { type: String, required: true },
  purchase_date: { type: Date, default: Date.now },
  purchase_price: { type: Number, required: true },
  
  fan: {
    fan_id: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    preferred_genre: String
  },
  
  concert: {
    concert_id: { type: String, required: true },
    concert_date: { type: Date, required: true },
    concert_time: String,
    description: String,
    organizer_name: String,
    arena_name: String,
    arena_location: String,
    artists: [{
      artist_name: String,
      genre: String
    }]
  },
  
  zone: {
    zone_name: { type: String, required: true },
    capacity_per_zone: Number
  }
}, { 
  timestamps: true,
  _id: false
});

// ========== ARTISTS COLLECTION ==========
// Includes performance history and statistics
export interface IArtist extends Document {
  _id: string;
  artist_name: string;
  genre: string;
  
  // Performance statistics (computed/cached)
  total_concerts: number;
  total_tickets_sold: number;
  average_ticket_price: number;
  
  // Recent concerts (embedded for quick access)
  recent_concerts: Array<{
    concert_id: string;
    concert_date: Date;
    arena_name: string;
    arena_location: string;
    tickets_sold: number;
  }>;
}

const ArtistSchema = new Schema<IArtist>({
  _id: { type: String, required: true },
  artist_name: { type: String, required: true },
  genre: String,
  
  total_concerts: { type: Number, default: 0 },
  total_tickets_sold: { type: Number, default: 0 },
  average_ticket_price: { type: Number, default: 0 },
  
  recent_concerts: [{
    concert_id: String,
    concert_date: Date,
    arena_name: String,
    arena_location: String,
    tickets_sold: Number
  }]
}, { 
  timestamps: true,
  _id: false
});

// ========== ARENAS COLLECTION ==========
// Includes usage statistics and zone information
export interface IArena extends Document {
  _id: string;
  arena_name: string;
  arena_location: string;
  total_capacity: number;
  
  zones: Array<{
    zone_name: string;
    capacity_per_zone: number;
  }>;
  
  // Usage statistics
  total_concerts: number;
  total_tickets_sold: number;
  utilization_rate: number; // percentage of capacity used on average
}

const ArenaSchema = new Schema<IArena>({
  _id: { type: String, required: true },
  arena_name: { type: String, required: true },
  arena_location: String,
  total_capacity: Number,
  
  zones: [{
    zone_name: { type: String, required: true },
    capacity_per_zone: { type: Number, required: true }
  }],
  
  total_concerts: { type: Number, default: 0 },
  total_tickets_sold: { type: Number, default: 0 },
  utilization_rate: { type: Number, default: 0 }
}, { 
  timestamps: true,
  _id: false
});

// Export models
export const UserModel = mongoose.model<IUser>('User', UserSchema);
export const ConcertModel = mongoose.model<IConcert>('Concert', ConcertSchema);
export const TicketModel = mongoose.model<ITicket>('Ticket', TicketSchema);
export const ArtistModel = mongoose.model<IArtist>('Artist', ArtistSchema);
export const ArenaModel = mongoose.model<IArena>('Arena', ArenaSchema);

// Create indexes for performance
export const createIndexes = async (): Promise<void> => {
  try {
    // User indexes
    await UserModel.createIndex({ 'fan_details.username': 1 });
    await UserModel.createIndex({ 'fan_details.preferred_genre': 1 });
    await UserModel.createIndex({ user_type: 1 });

    // Concert indexes
    await ConcertModel.createIndex({ concert_date: 1 });
    await ConcertModel.createIndex({ 'organizer.organizer_id': 1 });
    await ConcertModel.createIndex({ 'arena.arena_id': 1 });
    await ConcertModel.createIndex({ 'artists.genre': 1 });
    await ConcertModel.createIndex({ concert_date: 1, 'arena.arena_location': 1 }); // Compound index

    // Ticket indexes
    await TicketModel.createIndex({ 'fan.fan_id': 1 });
    await TicketModel.createIndex({ 'concert.concert_id': 1 });
    await TicketModel.createIndex({ purchase_date: 1 });
    await TicketModel.createIndex({ 'concert.concert_date': 1, 'fan.preferred_genre': 1 }); // Compound index for analytics

    // Artist indexes
    await ArtistModel.createIndex({ genre: 1 });
    await ArtistModel.createIndex({ total_concerts: -1 });
    await ArtistModel.createIndex({ total_tickets_sold: -1 });

    // Arena indexes
    await ArenaModel.createIndex({ arena_location: 1 });
    await ArenaModel.createIndex({ total_capacity: 1 });
    await ArenaModel.createIndex({ utilization_rate: -1 });

    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
    throw error;
  }
}; 