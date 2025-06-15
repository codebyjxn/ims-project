// src/services/concert-service.ts
// ========== CONCERT SERVICE ==========
// Contains business logic for concert operations with proper DTO mapping

import { RepositoryFactory } from '../repositories/factory';
import { 
  ConcertDTO,
  ArenaDTO,
  ConcertArtistDTO,
  ZonePricingDTO
} from '../dto';

export class ConcertService {

  /**
   * Get concert by ID with proper DTO mapping
   */
  static async getConcertById(concertId: string): Promise<ConcertDTO | null> {
    try {
      const factory = RepositoryFactory.getFactory();
      const concertRepo = factory.getConcertRepository();
      
      const concert = await concertRepo.findById(concertId);
      if (!concert) return null;
      
      return this.mapToConcertDTO(concert);
    } catch (error) {
      console.error('Error in ConcertService.getConcertById:', error);
      return null;
    }
  }

  /**
   * Get all concerts with proper DTO mapping
   */
  static async getAllConcerts(): Promise<any[]> {
    try {
      const factory = RepositoryFactory.getFactory();
      const concertRepo = factory.getConcertRepository();
      const arenaRepo = factory.getArenaRepository();

      const concerts = await concertRepo.findAll();
      const arenas = await arenaRepo.findAll();

      // Build a map of arena_id to arena details
      const arenaMap = Object.fromEntries(
        arenas.map((arena: any) => [arena.arena_id || arena._id, this.mapToArenaDTO(arena)])
      );

      // Attach arena details to each concert
      return concerts.map(concert => {
        const concertDTO = this.mapToConcertDTO(concert);
        const arena = arenaMap[concert.arena_id];
        return {
          ...concertDTO,
          arena,
          arena_capacity: arena?.total_capacity
        };
      });
    } catch (error) {
      console.error('Error in ConcertService.getAllConcerts:', error);
      return [];
    }
  }

  /**
   * Get concerts by organizer with proper DTO mapping
   */
  static async getConcertsByOrganizer(organizerId: string): Promise<ConcertDTO[]> {
    const factory = RepositoryFactory.getFactory();
    const concertRepo = factory.getConcertRepository();
    
    const concerts = await concertRepo.findByOrganizer(organizerId);
    return concerts.map(concert => this.mapToConcertDTO(concert));
  }

  /**
   * Get upcoming concerts with proper DTO mapping and arena details
   */
  static async getUpcomingConcerts(limit?: number, genre?: string): Promise<any[]> {
    const factory = RepositoryFactory.getFactory();
    const concertRepo = factory.getConcertRepository();
    const arenaRepo = factory.getArenaRepository();
    
    // Always use DB-level filtering for upcoming concerts
    let upcomingConcerts = await concertRepo.findUpcoming!();

    // Filter by genre if specified
    if (genre) {
      upcomingConcerts = upcomingConcerts.filter((concert: any) => {
        const artists = concert.artists || [];
        return Array.isArray(artists) && artists.some((artist: any) => 
          artist.genre?.toLowerCase().includes(genre.toLowerCase())
        );
      });
    }

    // Sort by date (earliest first)
    upcomingConcerts.sort((a: any, b: any) => 
      new Date(a.concert_date).getTime() - new Date(b.concert_date).getTime()
    );

    // Apply limit if specified
    if (limit) {
      upcomingConcerts = upcomingConcerts.slice(0, limit);
    }

    // Map concerts with enhanced data including arena details
    const enhancedConcerts = await Promise.all(
      upcomingConcerts.map(async (concert) => {
        const concertDTO = this.mapToConcertDTO(concert);
        
        // Fetch arena details
        let arena = null;
        try {
          const arenaData = await arenaRepo.findById(concert.arena_id);
          if (arenaData) {
            arena = this.mapToArenaDTO(arenaData);
          }
        } catch (error) {
          console.warn(`Failed to fetch arena for concert ${concert.concert_id || concert._id}:`, error);
        }

        // Generate concert name from description or use default
        const concert_name = concert.description 
          ? concert.description.split('.')[0].substring(0, 50) + (concert.description.length > 50 ? '...' : '')
          : `Concert at ${arena?.arena_name || 'TBD'}`;

        return {
          ...concertDTO,
          concert_name,
          arena,
          arena_capacity: arena?.total_capacity
        };
      })
    );

    return enhancedConcerts;
  }

  /**
   * Get concert with arena details and zone availability
   */
  static async getConcertWithArenaDetails(concertId: string): Promise<{
    concert: ConcertDTO;
    arena: ArenaDTO;
    zones: Array<{
      zone_name: string;
      capacity_per_zone: number;
      price: number;
      available_tickets: number;
      sold_tickets: number;
      availability_percentage: number;
    }>;
  } | null> {
    const factory = RepositoryFactory.getFactory();
    const concertRepo = factory.getConcertRepository();
    const arenaRepo = factory.getArenaRepository();
    const ticketRepo = factory.getTicketRepository();
    
    const concert = await concertRepo.findById(concertId);
    if (!concert) return null;
    
    const arena = await arenaRepo.findById(concert.arena_id);
    if (!arena) return null;
    
    const concertDTO = this.mapToConcertDTO(concert);
    const arenaDTO = this.mapToArenaDTO(arena);
    
    // Get zone availability information
    const zones = await Promise.all(
      arenaDTO.zones.map(async (zone) => {
        const availableTickets = await concertRepo.findAvailableTickets(concertId, zone.zone_name);
        const soldTickets = zone.capacity_per_zone - availableTickets;
        const availabilityPercentage = Math.round((availableTickets / zone.capacity_per_zone) * 100);
        
        // Get pricing for this zone
        const zonePricing = concertDTO.zone_pricing.find(p => p.zone_name === zone.zone_name);
        const price = zonePricing?.price || 0;
        
        return {
          zone_name: zone.zone_name,
          capacity_per_zone: zone.capacity_per_zone,
          price,
          available_tickets: availableTickets,
          sold_tickets: soldTickets,
          availability_percentage: availabilityPercentage
        };
      })
    );
    
    return {
      concert: concertDTO,
      arena: arenaDTO,
      zones
    };
  }

  /**
   * Get zone availability for a specific concert and zone
   */
  static async getZoneAvailability(concertId: string, zoneName: string): Promise<{
    concert_id: string;
    zone_name: string;
    capacity: number;
    available_tickets: number;
    sold_tickets: number;
    availability_percentage: number;
    price: number;
  } | null> {
    const factory = RepositoryFactory.getFactory();
    const concertRepo = factory.getConcertRepository();
    const arenaRepo = factory.getArenaRepository();
    
    const concert = await concertRepo.findById(concertId);
    if (!concert) return null;
    
    const arena = await arenaRepo.findById(concert.arena_id);
    if (!arena) return null;
    
    const zone = arena.zones?.find((z: any) => z.zone_name === zoneName);
    if (!zone) return null;
    
    const availableTickets = await concertRepo.findAvailableTickets(concertId, zoneName);
    const soldTickets = zone.capacity_per_zone - availableTickets;
    const availabilityPercentage = Math.round((availableTickets / zone.capacity_per_zone) * 100);
    
    // Get pricing
    const concertDTO = this.mapToConcertDTO(concert);
    const zonePricing = concertDTO.zone_pricing.find(p => p.zone_name === zoneName);
    const price = zonePricing?.price || 0;
    
    return {
      concert_id: concertDTO.concert_id,
      zone_name: zoneName,
      capacity: zone.capacity_per_zone,
      available_tickets: availableTickets,
      sold_tickets: soldTickets,
      availability_percentage: availabilityPercentage,
      price
    };
  }

  // ========== PRIVATE MAPPING METHODS ==========

  /**
   * Map database concert object to ConcertDTO with normalized IDs
   */
  private static mapToConcertDTO(concert: any): ConcertDTO {
    return {
      concert_id: concert.concert_id || concert._id, // Normalize ID field
      concert_date: concert.concert_date instanceof Date 
        ? concert.concert_date.toISOString() 
        : concert.concert_date,
      time: concert.time,
      description: concert.description,
      organizer_id: concert.organizer_id,
      arena_id: concert.arena_id,
      artists: (concert.artists || []).map((artist: any) => ({
        artist_id: artist.artist_id || artist._id,
        artist_name: artist.artist_name,
        genre: artist.genre
      })),
      zone_pricing: (concert.zone_pricing || []).map((pricing: any) => ({
        zone_name: pricing.zone_name,
        price: pricing.price
      })),
      status: concert.status || 'upcoming'
    };
  }

  /**
   * Map database arena object to ArenaDTO with normalized IDs
   */
  private static mapToArenaDTO(arena: any): ArenaDTO {
    return {
      arena_id: arena.arena_id || arena._id, // Normalize ID field
      arena_name: arena.arena_name,
      arena_location: arena.arena_location,
      total_capacity: arena.total_capacity,
      zones: (arena.zones || []).map((zone: any) => ({
        zone_name: zone.zone_name,
        capacity_per_zone: zone.capacity_per_zone
      }))
    };
  }
} 