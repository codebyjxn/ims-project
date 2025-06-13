export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export interface ApiResponse<T> {
  success: boolean;
  count: number;
  data: T;
}

export const request = async <T>(endpoint: string, options: RequestInit = {}, isPublic: boolean = false): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!isPublic) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Something went wrong');
  }

  return data;
}; 