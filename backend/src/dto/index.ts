// src/dto/index.ts
// ========== DATA TRANSFER OBJECTS (DTOs) ==========
// These define the standard API response format

export interface UserDTO {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'fan' | 'organizer' | 'admin';
  registration_date: string; // ISO string format
  last_login?: string; // ISO string format
}

export interface FanDTO extends UserDTO {
  user_type: 'fan';
  username: string;
  preferred_genre: string;
  phone_number: string;
  referral_code: string;
  referred_by?: string;
  referral_points: number;
  referral_code_used: boolean;
}

export interface OrganizerDTO extends UserDTO {
  user_type: 'organizer';
  organization_name: string;
  contact_info: string;
}

export interface ArtistDTO {
  artist_id: string;
  artist_name: string;
  genre: string;
}

export interface ZoneDTO {
  zone_name: string;
  capacity_per_zone: number;
}

export interface ArenaDTO {
  arena_id: string;
  arena_name: string;
  arena_location: string;
  total_capacity: number;
  zones: ZoneDTO[];
}

export interface ConcertArtistDTO {
  artist_id: string;
  artist_name: string;
  genre: string;
}

export interface ZonePricingDTO {
  zone_name: string;
  price: number;
}

export interface ConcertDTO {
  concert_id: string;
  concert_date: string; // ISO string format
  time: string;
  description: string;
  organizer_id: string;
  arena_id: string;
  artists: ConcertArtistDTO[];
  zone_pricing: ZonePricingDTO[];
}

export interface ArenaDTO {
  arena_id: string;
  arena_name: string;
  arena_location: string;
  total_capacity: number;
  zones: ArenaZoneDTO[];
}

export interface ArenaZoneDTO {
  zone_name: string;
  capacity_per_zone: number;
}

export interface TicketDTO {
  ticket_id: string;
  fan_id: string;
  concert_id: string;
  arena_id: string;
  zone_name: string;
  purchase_date: string; // ISO string format
  referral_code_used: boolean;
  price: number;
  // Additional denormalized fields for convenience
  fan_username?: string;
  concert_date?: string;
}

// ========== TICKET PURCHASE DTOs ==========

export interface TicketPurchaseRequestDTO {
  concert_id: string;
  zone_name: string;
  quantity: number;
  referral_code?: string;
}

export interface TicketPurchaseResponseDTO {
  success: boolean;
  tickets: TicketDTO[];
  total_amount: number;
  discount_applied: number;
  discount_percentage: number;
  confirmation_id: string;
  database_type: 'postgresql' | 'mongodb';
  message: string;
}

export interface ReferralValidationResult {
  is_valid: boolean;
  discount_percentage: number;
  referrer?: FanDTO;
  error?: string;
}

// ========== ABSTRACT SERVICE INTERFACES ==========
// These ensure both PostgreSQL and MongoDB services implement the same methods

export interface IUserService {
  getUserById(userId: string): Promise<UserDTO | FanDTO | OrganizerDTO | null>;
  getFanByUsername(username: string): Promise<FanDTO | null>;
  createFan(fanData: Omit<FanDTO, 'user_id' | 'registration_date'>): Promise<FanDTO>;
  createOrganizer(organizerData: Omit<OrganizerDTO, 'user_id' | 'registration_date'>): Promise<OrganizerDTO>;
  updateUser(userId: string, userData: Partial<UserDTO>): Promise<UserDTO | null>;
  deleteUser(userId: string): Promise<boolean>;
}

export interface IArtistService {
  getArtistById(artistId: string): Promise<ArtistDTO | null>;
  getAllArtists(): Promise<ArtistDTO[]>;
  getArtistsByGenre(genre: string): Promise<ArtistDTO[]>;
  createArtist(artistData: Omit<ArtistDTO, 'artist_id'>): Promise<ArtistDTO>;
  updateArtist(artistId: string, artistData: Partial<ArtistDTO>): Promise<ArtistDTO | null>;
  deleteArtist(artistId: string): Promise<boolean>;
}

export interface IArenaService {
  getArenaById(arenaId: string): Promise<ArenaDTO | null>;
  getAllArenas(): Promise<ArenaDTO[]>;
  getArenasByLocation(location: string): Promise<ArenaDTO[]>;
  createArena(arenaData: Omit<ArenaDTO, 'arena_id'>): Promise<ArenaDTO>;
  updateArena(arenaId: string, arenaData: Partial<ArenaDTO>): Promise<ArenaDTO | null>;
  deleteArena(arenaId: string): Promise<boolean>;
}

export interface IConcertService {
  getConcertById(concertId: string): Promise<ConcertDTO | null>;
  getAllConcerts(): Promise<ConcertDTO[]>;
  getConcertsByDate(date: string): Promise<ConcertDTO[]>;
  getConcertsByOrganizer(organizerId: string): Promise<ConcertDTO[]>;
  createConcert(concertData: Omit<ConcertDTO, 'concert_id'>): Promise<ConcertDTO>;
  updateConcert(concertId: string, concertData: Partial<ConcertDTO>): Promise<ConcertDTO | null>;
  deleteConcert(concertId: string): Promise<boolean>;
}

export interface ITicketService {
  getTicketById(ticketId: string): Promise<TicketDTO | null>;
  getTicketsByFan(fanId: string): Promise<TicketDTO[]>;
  getTicketsByConcert(concertId: string): Promise<TicketDTO[]>;
  createTicket(ticketData: Omit<TicketDTO, 'ticket_id' | 'purchase_date'>): Promise<TicketDTO>;
  cancelTicket(ticketId: string): Promise<boolean>;
}

// ========== UTILITY FUNCTIONS ==========

export class DTOValidators {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  static isFutureDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date > new Date();
  }

  static validateFanDTO(fan: Partial<FanDTO>): string[] {
    const errors: string[] = [];
    
    if (!fan.email || !this.isValidEmail(fan.email)) {
      errors.push('Valid email is required');
    }
    
    if (!fan.username || fan.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (!fan.first_name || fan.first_name.trim().length === 0) {
      errors.push('First name is required');
    }
    
    if (!fan.last_name || fan.last_name.trim().length === 0) {
      errors.push('Last name is required');
    }
    
    return errors;
  }

  static validateConcertDTO(concert: Partial<ConcertDTO>): string[] {
    const errors: string[] = [];
    
    if (!concert.concert_date || !this.isValidDate(concert.concert_date)) {
      errors.push('Valid concert date is required');
    } else if (!this.isFutureDate(concert.concert_date)) {
      errors.push('Concert date must be in the future');
    }
    
    if (!concert.organizer_id) {
      errors.push('Organizer ID is required');
    }
    
    if (!concert.arena_id) {
      errors.push('Arena ID is required');
    }
    
    if (!concert.artists || concert.artists.length === 0) {
      errors.push('At least one artist is required');
    }
    
    return errors;
  }
}