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
      name: string;
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
    collaborations: {
      artist1: string;
      artist2: string;
    }[];
}
  
class OrganizerService {
    async getOrganizerConcerts(organizerId?: string): Promise<OrganizerConcert[]> {
        const id = organizerId || this.getUserId();
        return request<{ concerts: OrganizerConcert[] }>(`/organizer/concerts/${id}`).then(data => data.concerts);
    }
    
    async getOrganizerStats(organizerId?: string): Promise<OrganizerStats> {
        const id = organizerId || this.getUserId();
        return request<OrganizerStats>(`/organizer/stats/${id}`);
    }

    async getArenas(): Promise<Arena[]> {
        return request<{ arenas: Arena[] }>('/organizer/arenas').then(data => data.arenas);
    }
    
    async getArtists(): Promise<Artist[]> {
        return request<{ artists: Artist[] }>('/organizer/artists').then(data => data.artists);
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

    private getUserId(): string | null {
        // Implementation depends on how user info is stored
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user?.id || null;
    }
}

const organizerService = new OrganizerService();
export default organizerService; 