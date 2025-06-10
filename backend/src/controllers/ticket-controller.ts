import pool from '../lib/postgres';
import { Request, Response } from 'express';

interface PurchaseTicketRequest {
  concertId: number;
  userId: number;
  useReferralPoints?: boolean;
}

interface TicketPurchaseResponse {
  success: boolean;
  ticket?: {
    id: number;
    concertId: number;
    userId: number;
    price: number;
    referralUsed: boolean;
  };
  message?: string;
  database: string;
}

export const purchaseTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { concertId, userId, useReferralPoints = false }: PurchaseTicketRequest = req.body;

    // Get concert details from PostgreSQL
    const concertQuery = 'SELECT * FROM concerts WHERE id = $1';
    const concertResult = await pool.query(concertQuery, [concertId]);
    
    if (concertResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Concert not found',
        database: 'PostgreSQL'
      });
      return;
    }

    const concert = concertResult.rows[0];

    // Check if tickets are available
    if (concert.available_tickets <= 0) {
      res.status(400).json({
        success: false,
        message: 'No tickets available',
        database: 'PostgreSQL'
      });
      return;
    }

    // Get user details
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        database: 'PostgreSQL'
      });
      return;
    }

    const user = userResult.rows[0];
    let finalPrice = concert.ticket_price;
    let referralUsed = false;

    // Apply referral points discount if requested and available
    if (useReferralPoints && user.referral_points >= 10) {
      const discount = Math.min(user.referral_points * 0.5, finalPrice * 0.2); // Max 20% discount
      finalPrice = Math.max(finalPrice - discount, finalPrice * 0.8);
      referralUsed = true;
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Insert ticket
      const ticketQuery = `
        INSERT INTO tickets (concert_id, user_id, price_paid, referral_used, status)
        VALUES ($1, $2, $3, $4, 'active')
        RETURNING *
      `;
      const ticketResult = await pool.query(ticketQuery, [concertId, userId, finalPrice, referralUsed]);
      const ticket = ticketResult.rows[0];

      // Update concert available tickets
      const updateConcertQuery = 'UPDATE concerts SET available_tickets = available_tickets - 1 WHERE id = $1';
      await pool.query(updateConcertQuery, [concertId]);

      // Update user referral points if used
      if (referralUsed) {
        const pointsUsed = Math.min(10, user.referral_points);
        const updateUserQuery = 'UPDATE users SET referral_points = referral_points - $1 WHERE id = $2';
        await pool.query(updateUserQuery, [pointsUsed, userId]);
      }

      // Add referral points for purchase (1 point per $10 spent)
      const pointsEarned = Math.floor(finalPrice / 10);
      if (pointsEarned > 0) {
        const addPointsQuery = 'UPDATE users SET referral_points = referral_points + $1 WHERE id = $2';
        await pool.query(addPointsQuery, [pointsEarned, userId]);
      }

      await pool.query('COMMIT');

      res.status(201).json({
        success: true,
        ticket: {
          id: ticket.id,
          concertId: ticket.concert_id,
          userId: ticket.user_id,
          price: ticket.price_paid,
          referralUsed: ticket.referral_used
        },
        message: 'Ticket purchased successfully',
        database: 'PostgreSQL'
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error purchasing ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      database: 'PostgreSQL'
    });
  }
};

// Get user's tickets
export const getUserTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT 
        t.*,
        c.title as concert_title,
        c.date as concert_date,
        v.name as venue_name,
        a.name as artist_name
      FROM tickets t
      JOIN concerts c ON t.concert_id = c.id
      JOIN venues v ON c.venue_id = v.id
      JOIN artists a ON c.artist_id = a.id
      WHERE t.user_id = $1
      ORDER BY c.date DESC
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      tickets: result.rows,
      database: 'PostgreSQL'
    });

  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      database: 'PostgreSQL'
    });
  }
};

// Get concert ticket sales summary
export const getConcertTicketSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { concertId } = req.params;

    const query = `
      SELECT 
        c.title,
        c.ticket_price,
        c.available_tickets,
        COUNT(t.id) as tickets_sold,
        SUM(t.price_paid) as total_revenue,
        AVG(t.price_paid) as average_price
      FROM concerts c
      LEFT JOIN tickets t ON c.id = t.concert_id
      WHERE c.id = $1
      GROUP BY c.id, c.title, c.ticket_price, c.available_tickets
    `;

    const result = await pool.query(query, [concertId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Concert not found',
        database: 'PostgreSQL'
      });
      return;
    }

    res.json({
      success: true,
      summary: result.rows[0],
      database: 'PostgreSQL'
    });

  } catch (error) {
    console.error('Error fetching concert summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      database: 'PostgreSQL'
    });
  }
}; 