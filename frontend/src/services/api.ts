const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: 'fan' | 'organizer' | 'admin';
    fanDetails?: {
      username: string;
      preferredGenre: string;
      phoneNumber: string;
      referralCode: string;
      referralPoints: number;
    };
    organizerDetails?: {
      organizationName: string;
      contactInfo: string;
    };
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupFanData extends LoginCredentials {
  firstName: string;
  lastName: string;
  username: string;
  preferredGenre?: string;
  phoneNumber?: string;
}

export interface SignupOrganizerData extends LoginCredentials {
  firstName: string;
  lastName: string;
  organizationName: string;
  contactInfo: string;
}

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

export interface TicketPurchaseData {
  concertId: string;
  zoneId: string;
  quantity: number;
  referralCode?: string;
}

export interface TicketValidationData {
  concertId: string;
  zoneId: string;
  quantity: number;
  referralCode?: string;
}

export interface UserTicket {
  id: string;
  concert: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    arena: {
      name: string;
      location: string;
    };
  };
  zone: {
    id: string;
    name: string;
  };
  quantity: number;
  totalPrice: number;
  purchaseDate: string;
}

export interface ReferralValidation {
  isValid: boolean;
  discount?: number;
  message: string;
}

// Organizer-specific interfaces
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

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signupFan(data: SignupFanData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        userType: 'fan',
      }),
    });
  }

  async signupOrganizer(data: SignupOrganizerData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        userType: 'organizer',
      }),
    });
  }

  async getUpcomingConcerts(limit?: number, genre?: string): Promise<Concert[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (genre) params.append('genre', genre);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.request<{ concerts: Concert[] }>(`/concerts/upcoming${query}`);
    return response.concerts || [];
  }

  async getConcertById(id: string): Promise<Concert> {
    const response = await this.request<{ concert: Concert }>(`/concerts/${id}`);
    return response.concert;
  }

  async validateTicketPurchase(data: TicketValidationData): Promise<{ isValid: boolean; message: string; totalPrice?: number }> {
    return this.request(`/tickets/validate-purchase`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async purchaseTickets(data: TicketPurchaseData): Promise<{ message: string; ticketId: string; totalPrice: number }> {
    return this.request(`/tickets/purchase`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserTickets(): Promise<UserTicket[]> {
    return this.request<UserTicket[]>('/tickets/user');
  }

  async validateReferralCode(code: string): Promise<ReferralValidation> {
    return this.request<ReferralValidation>(`/referrals/validate`, {
      method: 'POST',
      body: JSON.stringify({ referralCode: code }),
    });
  }

  // Organizer-specific methods
  async getOrganizerConcerts(organizerId?: string): Promise<OrganizerConcert[]> {
    if (!organizerId) {
      throw new Error('Organizer ID is required');
    }
    return this.request<OrganizerConcert[]>(`/organizer/concerts/${organizerId}`);
  }

  async getOrganizerStats(organizerId?: string): Promise<OrganizerStats> {
    if (!organizerId) {
      throw new Error('Organizer ID is required');
    }
    return this.request<OrganizerStats>(`/organizer/stats/${organizerId}`);
  }

  async getArenas(): Promise<Arena[]> {
    return this.request<Arena[]>('/organizer/arenas');
  }

  async getArtists(): Promise<Artist[]> {
    return this.request<Artist[]>('/organizer/artists');
  }

  async createConcert(data: ConcertCreationData): Promise<{ message: string; concertId: string }> {
    return this.request<{ message: string; concertId: string }>('/organizer/concerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConcertDetails(concertId: string): Promise<OrganizerConcert> {
    return this.request<OrganizerConcert>(`/organizer/concerts/${concertId}/details`);
  }

  async updateConcert(concertId: string, data: Partial<ConcertCreationData>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/organizer/concerts/${concertId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteConcert(concertId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/organizer/concerts/${concertId}`, {
      method: 'DELETE',
    });
  }

  async getConcertAnalytics(concertId: string): Promise<any> {
    return this.request(`/organizer/concerts/${concertId}/analytics`);
  }
}

export const api = new ApiService(); 