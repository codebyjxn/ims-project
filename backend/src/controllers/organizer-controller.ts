import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { getPool } from '../lib/postgres';
import { migrationStatus } from '../services/migration-status';
import { getUsersCollection } from '../models/mongodb-schemas';
import { OrganizerService } from '../services/organizer-service';

interface ZoneData {
  zone_name: string;
  capacity_per_zone: number;
  price: number;
}

export class OrganizerController {

  async getOrganizerConcerts(req: Request, res: Response): Promise<void> {
    try {
      const { organizerId } = req.params;
      const concerts = await OrganizerService.getOrganizerConcerts(organizerId);
      res.json(concerts);
    } catch (error) {
      console.error('Error fetching organizer concerts:', error);
      res.status(500).json({ error: 'Failed to fetch organizer concerts' });
    }
  }

  // Get organizer statistics
  async getOrganizerStats(req: Request, res: Response): Promise<void> {
    try {
      const { organizerId } = req.params;
      const stats = await OrganizerService.getOrganizerStats(organizerId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching organizer stats:', error);
      res.status(500).json({ error: 'Failed to fetch organizer stats' });
    }
  }

  // Get all arenas
  async getArenas(req: Request, res: Response): Promise<void> {
    try {
      const arenas = await OrganizerService.getArenas();
      res.json(arenas);
    } catch (error) {
      console.error('Error fetching arenas:', error);
      res.status(500).json({ error: 'Failed to fetch arenas' });
    }
  }

  // Get all artists
  async getArtists(req: Request, res: Response): Promise<void> {
    try {
      const artists = await OrganizerService.getArtists();
      res.json(artists);
    } catch (error) {
      console.error('Error fetching artists:', error);
      res.status(500).json({ error: 'Failed to fetch artists' });
    }
  }

  // Create a new concert
  async createConcert(req: Request, res: Response): Promise<void> {
    try {
      const concertData = req.body;
      const concert = await OrganizerService.createConcert(concertData);
      res.status(201).json(concert);
    } catch (error) {
      console.error('Error creating concert:', error);
      res.status(500).json({ error: 'Failed to create concert' });
    }
  }

  // Get concert details
  async getConcertDetails(req: Request, res: Response): Promise<void> {
    try {
      const { concertId } = req.params;
      const currentDb = migrationStatus.getDatabaseType();

      if (currentDb === 'mongodb') {

        res.status(501).json({ error: 'MongoDB implementation pending' });
        return;
      } else {

        const pool = getPool();
        
        const query = `
          SELECT 
            c.concert_id,
            c.description as title,
            c.concert_date as date,
            c.time,
            a.arena_name as arena_name,
            a.arena_location as arena_location,
            a.total_capacity as arena_capacity,
            COUNT(DISTINCT t.ticket_id) as tickets_sold,
            COALESCE(SUM(czp.price), 0) as total_revenue,
            CASE 
              WHEN c.concert_date > CURRENT_DATE THEN 'upcoming'
              WHEN c.concert_date = CURRENT_DATE THEN 'ongoing'
              ELSE 'completed'
            END as status
          FROM concerts c
          LEFT JOIN arenas a ON c.arena_id = a.arena_id
          LEFT JOIN tickets t ON c.concert_id = t.concert_id
          LEFT JOIN concert_zone_pricing czp ON t.concert_id = czp.concert_id 
            AND t.arena_id = czp.arena_id 
            AND t.zone_name = czp.zone_name
          WHERE c.concert_id = $1
          GROUP BY c.concert_id, c.description, c.concert_date, c.time, 
                   a.arena_name, a.arena_location, a.total_capacity
        `;

        const result = await pool.query(query, [concertId]);
        
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Concert not found' });
          return;
        }

        const concert = result.rows[0];


        const artistQuery = `
          SELECT ar.artist_name as name, ar.genre
          FROM concert_features_artists cfa
          JOIN artists ar ON cfa.artist_id = ar.artist_id
          WHERE cfa.concert_id = $1
        `;
        const artistResult = await pool.query(artistQuery, [concertId]);
        concert.artists = artistResult.rows;
        

        concert.arena = {
          name: concert.arena_name,
          location: concert.arena_location,
          capacity: concert.arena_capacity
        };
        
        delete concert.arena_name;
        delete concert.arena_location;
        delete concert.arena_capacity;

        res.json(concert);
      }
    } catch (error) {
      console.error('Error fetching concert details:', error);
      res.status(500).json({ error: 'Failed to fetch concert details' });
    }
  }


  async updateConcert(req: Request, res: Response): Promise<void> {
    try {
      const { concertId } = req.params;
      const updates = req.body;

      const currentDb = migrationStatus.getDatabaseType();

      if (currentDb === 'mongodb') {

        res.status(501).json({ error: 'MongoDB implementation pending' });
        return;
      } else {

        const pool = getPool();
        

        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (updates.description) {
          updateFields.push(`description = $${paramIndex++}`);
          values.push(updates.description);
        }
        if (updates.date) {
          updateFields.push(`concert_date = $${paramIndex++}`);
          values.push(updates.date);
        }
        if (updates.time) {
          updateFields.push(`time = $${paramIndex++}`);
          values.push(updates.time);
        }

        const updateQuery = `
          UPDATE concerts
          SET ${updateFields.join(', ')}
          WHERE concert_id = $${paramIndex}
        `;
        values.push(concertId);

        await pool.query(updateQuery, values);

        res.status(200).json({ message: 'Concert updated successfully' });
      }
    } catch (error) {
      console.error('Error updating concert:', error);
      res.status(500).json({ error: 'Failed to update concert', details: error instanceof Error ? error.message : error });
    }
  }




  // Get available arenas for a specific date
  async getAvailableArenas(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.query;
      
      if (!date || typeof date !== 'string') {
        res.status(400).json({ error: 'Date parameter is required' });
        return;
      }

      const availableArenas = await OrganizerService.getAvailableArenas(date);
      res.json(availableArenas);
    } catch (error) {
      console.error('Error fetching available arenas:', error);
      res.status(500).json({ error: 'Failed to fetch available arenas' });
    }
  }

  // Get available artists for a specific date
  async getAvailableArtists(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.query;
      
      if (!date || typeof date !== 'string') {
        res.status(400).json({ error: 'Date parameter is required' });
        return;
      }

      const availableArtists = await OrganizerService.getAvailableArtists(date);
      res.json(availableArtists);
    } catch (error) {
      console.error('Error fetching available artists:', error);
      res.status(500).json({ error: 'Failed to fetch available artists' });
    }
  }
}