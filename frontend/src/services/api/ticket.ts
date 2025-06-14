import { request } from './base';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

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
    ticket_id: string;
    fan_id: string;
    concert_id: string;
    zone_name: string;
    purchase_date: string;
    purchase_price: number;
    concert_name: string;
    concert_date: string;
    concert_time: string;
    arena_name: string;
    arena_location: string;
}
  
export interface Ticket {
    ticket_id: string;
    fan_id: string;
    concert_id: string;
    arena_id: string;
    zone_name: string;
    purchase_date: string;
    purchase_price: number;
    // Denormalized fields from backend
    concert_name?: string;
    concert_date?: string;
    concert_time?: string;
    arena_name?: string;
    arena_location?: string;
}
  
class TicketService {
    async validateTicketPurchase(data: TicketValidationData): Promise<{ isValid: boolean; message: string; totalPrice?: number }> {
        return request<{ isValid: boolean; message: string; totalPrice?: number }>('/tickets/validate-purchase', {
          method: 'POST',
          body: JSON.stringify(data),
        });
    }
    
    async purchaseTickets(data: TicketPurchaseData): Promise<{ message: string; ticketId: string; totalPrice: number }> {
        return request<{ message: string; ticketId: string; totalPrice: number }>('/tickets/purchase', {
          method: 'POST',
          body: JSON.stringify(data),
        });
    }

    async getUserTickets(): Promise<UserTicket[]> {
        return request<{ tickets: UserTicket[] }>('/tickets/my-tickets')
          .then(data => data.tickets);
      }
}

const ticketService = new TicketService();
export default ticketService; 