import { request } from './base';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export interface Arena {
    arena_id: string;
    arena_name: string;
    arena_location: string;
    total_capacity: number;
    zones: {
      zone_name: string;
      capacity_per_zone: number;
    }[];
}
  
export interface Artist {
    artist_id: string;
    artist_name: string;
    genre: string;
}
  
export interface OrganizerConcert {
    concert_id: string;
    title: string;
    date: string;
    time: string;
    arena: {
      name: string;
      location: string;
      capacity: number;
    };
    artists: {
      artist_id: string;
      artist_name: string;
      genre: string;
    }[];
    ticketsSold: number;
    totalRevenue: number;
    status: 'upcoming' | 'ongoing' | 'completed';
}
  
export interface OrganizerStats {
    totalConcerts: number;
    upcomingConcerts: number;
    totalTicketsSold: number;
    totalRevenue: number;
    averageAttendance: number;
}
  
export interface ConcertCreationData {
    organizerId?: string; // Optional - backend will auto-assign from authenticated user
    title: string;
    description: string;
    date: string;
    time: string;
    arenaId: string;
    zones: {
      zone_name: string;
      capacity_per_zone: number;
      price: number;
    }[];
    artists: string[];
}
  
class OrganizerService {
    async getOrganizerConcerts(organizerId?: string): Promise<OrganizerConcert[]> {
        const id = organizerId || this.getUserId();
        const concerts = await request<any[]>(`/organizer/concerts/${id}`);
        return concerts.map(concert => ({
          concert_id: concert.concert_id,
          title: concert.title,
          date: concert.date,
          time: concert.time,
          arena: {
            name: concert.arena?.name || concert.arena_name,
            location: concert.arena?.location || concert.arena_location,
            capacity: concert.arena?.capacity || concert.arena_capacity,
          },
          artists: (concert.artists || []).map((artist: any) => ({
            artist_id: artist.artist_id || artist._id || '',
            artist_name: artist.artist_name || artist.name || '',
            genre: artist.genre || '',
          })),
          ticketsSold: concert.tickets_sold ?? concert.ticketsSold ?? 0,
          totalRevenue: concert.total_revenue ?? concert.totalRevenue ?? 0,
          status: concert.status,
        }));
    }
    
    async getOrganizerStats(organizerId?: string): Promise<OrganizerStats> {
        const id = organizerId || this.getUserId();
        const stats = await request<any>(`/organizer/stats/${id}`);
        return {
          totalConcerts: stats.totalConcerts ?? stats.total_concerts ?? 0,
          upcomingConcerts: stats.upcomingConcerts ?? stats.upcoming_concerts ?? 0,
          totalTicketsSold: stats.totalTicketsSold ?? stats.total_tickets_sold ?? 0,
          totalRevenue: stats.totalRevenue ?? stats.total_revenue ?? 0,
          averageAttendance: stats.averageAttendance ?? stats.average_attendance ?? 0,
        };
    }

    async getArenas(): Promise<Arena[]> {
        const arenas = await request<any[]>(`/organizer/arenas`);
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
    
    async getArtists(): Promise<Artist[]> {
        const artists = await request<any[]>(`/organizer/artists`);
        return artists.map((artist: any) => ({
          artist_id: artist.artist_id || artist._id || '',
          artist_name: artist.artist_name || artist.name || '',
          genre: artist.genre || '',
        }));
    }
    
    async createConcert(data: ConcertCreationData): Promise<{ message: string; concertId: string }> {
        return request<{ message: string; concertId: string }>('/organizer/concerts', {
          method: 'POST',
          body: JSON.stringify(data),
        });
    }

    async getConcertDetails(concertId: string): Promise<OrganizerConcert> {
        return request<OrganizerConcert>(`/organizer/concerts/${concertId}/details`);
    }
    
    async updateConcert(concertId: string, data: Partial<ConcertCreationData>): Promise<{ message: string }> {
        return request<{ message: string }>(`/organizer/concerts/${concertId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
    }
    
    async deleteConcert(concertId: string): Promise<{ message: string }> {
        return request<{ message: string }>(`/organizer/concerts/${concertId}`, {
          method: 'DELETE',
        });
    }

    async getConcertAnalytics(concertId: string): Promise<any> {
        return request<any>(`/organizer/concerts/${concertId}/analytics`);
    }

    async getArenasAnalytics(): Promise<any[]> {
        return request<any[]>(`/organizer/arenas/analytics`);
    }

    private getUserId(): string | null {
        // Implementation depends on how user info is stored
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user?.id || null;
    }
}

const organizerService = new OrganizerService();
export default organizerService;