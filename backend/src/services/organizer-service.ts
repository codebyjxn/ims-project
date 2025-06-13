import { RepositoryFactory } from '../repositories/factory';
import { OrganizerConcertDTO, OrganizerStatsDTO, ArenaDTO, ArtistDTO } from '../dto';

export class OrganizerService {
  static async getOrganizerConcerts(organizerId: string): Promise<OrganizerConcertDTO[]> {
    const factory = RepositoryFactory.getFactory();
    const organizerRepo = factory.getOrganizerRepository();
    const concerts = await organizerRepo.findConcertsByOrganizer(organizerId);
    return concerts.map((concert: any) => ({
      concert_id: concert.concert_id,
      title: concert.title,
      date: concert.date,
      time: concert.time,
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
      arena_id: arena.arena_id,
      arena_name: arena.arena_name,
      arena_location: arena.arena_location,
      total_capacity: arena.total_capacity,
      zones: (arena.zones || []).map((zone: any) => ({
        zone_name: zone.zone_name,
        capacity_per_zone: zone.capacity_per_zone,
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

  static async getArenasAnalytics(organizerId: string): Promise<any[]> {
    const factory = RepositoryFactory.getFactory();
    const organizerRepo = factory.getOrganizerRepository();
    return await organizerRepo.getArenasAnalytics(organizerId);
  }
} 