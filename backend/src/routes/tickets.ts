import { Router } from 'express';
import { purchaseTicket, getUserTickets, getConcertTicketSummary } from '../controllers/ticket-controller';

const router = Router();

// Purchase a ticket
router.post('/purchase', purchaseTicket);

// Get tickets for a specific user
router.get('/user/:userId', getUserTickets);

// Get ticket sales summary for a concert
router.get('/concert/:concertId/summary', getConcertTicketSummary);

export default router; 