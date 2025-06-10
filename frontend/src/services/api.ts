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
}

export const api = new ApiService(); 