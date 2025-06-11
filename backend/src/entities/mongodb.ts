// src/entities/mongodb.ts
// ========== MONGODB INTERFACES ==========
// These represent the MongoDB document structure

export interface IUser {
  _id: string;
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

export interface IArtist {
  _id: string;
  artist_name: string;
  genre: string;
}

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

export interface IConcert {
  _id: string;
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

export interface ITicket {
  _id: string;
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