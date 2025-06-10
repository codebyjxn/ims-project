import { Router } from 'express';
import { purchaseTicket, getUserTickets, getConcertTicketSummary, validatePurchase } from '../controllers/ticket-controller';

const router = Router();

// Validate purchase before payment
router.post('/validate-purchase', validatePurchase);

// Purchase a ticket
router.post('/purchase', purchaseTicket);

// Get tickets for a specific user
router.get('/user/:userId', getUserTickets);

// Get ticket sales summary for a concert
router.get('/concert/:concertId/summary', getConcertTicketSummary);

export default router; 