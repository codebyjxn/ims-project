import { request } from './base';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export interface UpcomingConcertPerformance {
    concert_id: string;
    concert_name: string;
    concert_date: string;
    description: string;
    arena_name: string;
    artists: string;
    tickets_sold: number;
    total_revenue: number;
}

export interface OrganizerAnalytics {
    orgId: string;
    orgName: string;
    contact: string;
    arena: string;
    location: string;
    concerts: number;
    revenue: number;
    tickets: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    uniqueFans: number;
    avgTicketsPerConcert: number;
}

class AdminService {
    async getUpcomingConcertsPerformance(): Promise<UpcomingConcertPerformance[]> {
        return request<UpcomingConcertPerformance[]>('/analytics/upcoming-performance');
    }
    
    async getHealth(): Promise<any> {
        return request<any>('/admin/health');
    }
    
    async seedDatabase(): Promise<any> {
        return request<any>('/admin/seed', { method: 'POST' });
    }
    
    async migrateToNoSQL(): Promise<any> {
        return request<any>('/admin/migrate', { method: 'POST' });
    }
    
    async getOrganizersAnalytics(): Promise<{ database: string; analytics: OrganizerAnalytics[]; timestamp: string }> {
        return request<{ database: string; analytics: OrganizerAnalytics[]; timestamp: string }>('/admin/organizers-analytics');
    }
}

const adminService = new AdminService();
export default adminService; 