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
    description: string;
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
    zone_pricing: {
      zone_name: string;
      price: number;
    }[];
}
  
export interface OrganizerStats {
    totalConcerts: number;
    upcomingConcerts: number;
    totalTicketsSold: number;
    totalRevenue: number;
    averageAttendance: number;
}
  
export interface ConcertCreationData {
    organizerId?: string;
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
          description: concert.description,
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
          zone_pricing: concert.zone_pricing || [],
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
        return request<Arena[]>('/organizer/arenas');
    }

    async getAvailableArenas(date: string): Promise<Arena[]> {
        const params = new URLSearchParams();
        params.append('date', date);
        return request<Arena[]>(`/organizer/arenas/available?${params.toString()}`);
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


    async getAvailableArtists(date: string): Promise<Artist[]> {
        const artists = await request<any[]>(`/organizer/artists/available?date=${encodeURIComponent(date)}`);
        return artists.map((artist: any) => ({
          artist_id: artist.artist_id || artist._id || '',
          artist_name: artist.artist_name || artist.name || '',
          genre: artist.genre || '',
        }));
    }

    private getUserId(): string | null {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user?.id || null;
    }
}

const organizerService = new OrganizerService();
export default organizerService;