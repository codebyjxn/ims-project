import { request } from './base';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName:string;
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

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, true);
  }

  async signupFan(data: SignupFanData): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ ...data, userType: 'fan' }),
    }, true);
  }

  async signupOrganizer(data: SignupOrganizerData): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ ...data, userType: 'organizer' }),
    }, true);
  }
}

const authService = new AuthService();
export default authService; 