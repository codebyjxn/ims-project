// src/entities/postgres.ts
// ========== POSTGRESQL ENTITY INTERFACES ==========
// These represent the PostgreSQL database structure

export interface PostgresUser {
  user_id: string;
  email: string;
  user_password: string;
  first_name: string;
  last_name: string;
  user_type: string;
  registration_date: Date;
  last_login?: Date;
}

export interface PostgresFan {
  user_id: string;
  username: string;
  preferred_genre: string;
  phone_number: string;
  referral_code: string;
  referred_by?: string;
  referral_points: number;
  referral_code_used: boolean;
}

export interface PostgresOrganizer {
  user_id: string;
  organization_name: string;
  contact_info: string;
}

export interface PostgresArtist {
  artist_id: string;
  artist_name: string;
  genre: string;
}

export interface PostgresArena {
  arena_id: string;
  arena_name: string;
  arena_location: string;
  total_capacity: number;
}

export interface PostgresZone {
  arena_id: string;
  zone_name: string;
  capacity_per_zone: number;
}

export interface PostgresConcert {
  concert_id: string;
  organizer_id: string;
  concert_date: Date;
  time: string;
  description: string;
  arena_id: string;
}

export interface PostgresTicket {
  ticket_id: string;
  fan_id: string;
  concert_id: string;
  arena_id: string;
  zone_name: string;
  purchase_date: Date;
  referral_code_used: boolean;
}

// Type for zone pricing from the concert_zone_pricing table
export interface PostgresZonePricing {
  concert_id: string;
  arena_id: string;
  zone_name: string;
  price: number;
}