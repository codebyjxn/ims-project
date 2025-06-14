import { request } from './base';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export interface Concert {
  concert_id: string;
  concert_name?: string;
  concert_date: string;
  time: string;
  description?: string;
  arena_id?: string;
  arena_capacity?: number;
  artists: {
    artist_id: string;
    artist_name: string;
    genre: string;
  }[];
  zone_pricing: {
    zone_name: string;
    price: number;
  }[];
  arena?: {
    arena_id: string;
    arena_name: string;
    arena_location: string;
    total_capacity: number;
    zones?: {
      zone_name: string;
      capacity_per_zone: number;
      price: number;
      availableTickets: number;
    }[];
  };
}

class ConcertService {
    async getUpcomingConcerts(limit?: number, genre?: string): Promise<Concert[]> {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (genre) params.append('genre', genre);
        return request<{ concerts: Concert[] }>(`/concerts/upcoming?${params.toString()}`).then(data => data.concerts);
    }
    
    async getConcertById(id: string): Promise<Concert> {
        return request<{ concert: Concert }>(`/concerts/${id}`).then(data => data.concert);
    }
}

const concertService = new ConcertService();
export default concertService; 