import { RepositoryFactory } from '../repositories/factory';
import { OrganizerConcertDTO, OrganizerStatsDTO, ArenaDTO, ArtistDTO } from '../dto';

export class OrganizerService {
  static async getOrganizerConcerts(organizerId: string): Promise<OrganizerConcertDTO[]> {
    const factory = RepositoryFactory.getFactory();
    const organizerRepo = factory.getOrganizerRepository();
    const concerts = await organizerRepo.findConcertsByOrganizer(organizerId);
    return concerts.map((concert: any) => ({
      concert_id: concert.concert_id,
      date: concert.concert_date,
      time: concert.time,
      description: concert.description,
      arena: {
        name: concert.arena_name || (concert.arena && concert.arena.name),
        location: concert.arena_location || (concert.arena && concert.arena.location),
        capacity: concert.arena_capacity || (concert.arena && concert.arena.capacity),
      },
      tickets_sold: concert.tickets_sold,
      total_revenue: concert.total_revenue,
      status: concert.status,
      artists: (concert.artists || []).map((artist: any) => ({
        artist_id: artist.artist_id || artist._id || '',
        artist_name: artist.name || artist.artist_name || '',
        genre: artist.genre || '',
      })),
    }));
  }

  static async getOrganizerStats(organizerId: string): Promise<OrganizerStatsDTO> {
    const factory = RepositoryFactory.getFactory();
    const organizerRepo = factory.getOrganizerRepository();
    const stats = await organizerRepo.getStats(organizerId);
    return {
      totalConcerts: stats.totalConcerts,
      upcomingConcerts: stats.upcomingConcerts,
      totalTicketsSold: stats.totalTicketsSold,
      totalRevenue: stats.totalRevenue,
      averageAttendance: stats.averageAttendance,
    };
  }

  static async getArenas(): Promise<ArenaDTO[]> {
    const factory = RepositoryFactory.getFactory();
    const organizerRepo = factory.getOrganizerRepository();
    const arenas = await organizerRepo.getArenas();
    return arenas.map((arena: any) => ({
      arena_id: arena.arena_id || arena._id || '',
      arena_name: arena.arena_name || arena.name || '',
      arena_location: arena.arena_location || arena.location || '',
      total_capacity: arena.total_capacity || arena.capacity || 0,
      zones: (arena.zones || []).map((zone: any) => ({
        zone_name: zone.zone_name || zone.name || '',
        capacity_per_zone: zone.capacity_per_zone || zone.capacity || 0,
      })),
    }));
  }

  static async getArtists(): Promise<ArtistDTO[]> {
    const factory = RepositoryFactory.getFactory();
    const organizerRepo = factory.getOrganizerRepository();
    const artists = await organizerRepo.getArtists();
    return artists.map((artist: any) => ({
      artist_id: artist.artist_id || artist._id || '',
      artist_name: artist.artist_name || artist.name || '',
      genre: artist.genre || '',
    }));
  }

  static async createConcert(concertData: any): Promise<any> {
    const factory = RepositoryFactory.getFactory();
    const organizerRepo = factory.getOrganizerRepository();
    return await organizerRepo.createConcert(concertData);
  }



  static async getAvailableArenas(date: string): Promise<any[]> {
    const factory = RepositoryFactory.getFactory();
    const organizerRepo = factory.getOrganizerRepository();
    const concertRepo = factory.getConcertRepository();
    
    // Get all arenas
    const allArenas = await organizerRepo.getArenas();
    
    const concertDate = new Date(date);
    const concertsOnDate = await concertRepo.findByDate(concertDate);
    
    // Get arena IDs that are already booked on this date
    const bookedArenaIds = concertsOnDate.map(concert => concert.arena_id);
    
    // Filter out arenas
    const availableArenas = allArenas.filter(arena => {
      const arenaId = arena.arena_id;
      return !bookedArenaIds.includes(arenaId);
    });
    
    return availableArenas;
  }

  static async getAvailableArtists(date: string): Promise<ArtistDTO[]> {
    const factory = RepositoryFactory.getFactory();
    const organizerRepo = factory.getOrganizerRepository();
    const concertRepo = factory.getConcertRepository();
    
    // Get all artists
    const allArtists = await organizerRepo.getArtists();
    
    const concertDate = new Date(date);
    const concertsOnDate = await concertRepo.findByDate(concertDate);
    
    // Get artist IDs that are already booked on this date
    const bookedArtistIds: string[] = [];
    concertsOnDate.forEach(concert => {
      if (concert.artists && Array.isArray(concert.artists)) {
        concert.artists.forEach((artist: any) => {
          const artistId = artist.artist_id || artist._id;
          if (artistId && !bookedArtistIds.includes(artistId)) {
            bookedArtistIds.push(artistId);
          }
        });
      }
    });
    
    // Filter out artists that are already booked
    const availableArtists = allArtists.filter(artist => {
      const artistId = artist.artist_id || artist._id;
      return !bookedArtistIds.includes(artistId);
    });
    
    return availableArtists.map((artist: any) => ({
      artist_id: artist.artist_id || artist._id || '',
      artist_name: artist.artist_name || artist.name || '',
      genre: artist.genre || '',
    }));
  }
} 