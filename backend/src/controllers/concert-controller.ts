// src/controllers/clean-concert-controller.ts
// ========== CLEAN CONCERT CONTROLLER ==========
// Clean API controller for concert operations with consistent DTOs

import { Request, Response } from 'express';
import { ConcertService } from '../services/concert-service';
import { DataService } from '../services/data-service';

export class ConcertController {

  /**
   * GET /api/concerts
   * Get all concerts with filtering and pagination
   */
  static async getConcerts(req: Request, res: Response): Promise<void> {
    try {
      const { 
        limit = 20, 
        offset = 0, 
        city, 
        date, 
        genre,
        organizer 
      } = req.query;

      const concerts = await ConcertService.getAllConcerts();
      
      // Apply filters
      let filteredConcerts = concerts;
      
      if (city) {
        filteredConcerts = filteredConcerts.filter(concert => 
          concert.arena_id?.toLowerCase().includes((city as string).toLowerCase())
        );
      }
      
      if (date) {
        const filterDate = new Date(date as string);
        filteredConcerts = filteredConcerts.filter(concert => {
          const concertDate = new Date(concert.concert_date);
          return concertDate.toDateString() === filterDate.toDateString();
        });
      }
      
      if (genre) {
        filteredConcerts = filteredConcerts.filter(concert => {
          return Array.isArray(concert.artists) && concert.artists.some(artist => 
            artist.genre?.toLowerCase().includes((genre as string).toLowerCase())
          );
        });
      }

      if (organizer) {
        filteredConcerts = filteredConcerts.filter(concert => 
          concert.organizer_id === organizer
        );
      }

      // Apply pagination
      const startIndex = parseInt(offset as string);
      const endIndex = startIndex + parseInt(limit as string);
      const paginatedConcerts = filteredConcerts.slice(startIndex, endIndex);

      res.json({
        success: true,
        count: paginatedConcerts.length,
        total: filteredConcerts.length,
        concerts: paginatedConcerts,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: endIndex < filteredConcerts.length
        },
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error fetching concerts:', error);
      res.status(500).json({ 
        error: 'Failed to fetch concerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/concerts/:id
   * Get concert details by ID including zone information and availability
   */
  static async getConcertById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Concert ID is required' });
        return;
      }

      // Use ConcertService to get properly mapped data
      const concertWithDetails = await ConcertService.getConcertWithArenaDetails(id);
      if (!concertWithDetails) {
        res.status(404).json({ error: 'Concert not found' });
        return;
      }

      res.json({
        success: true,
        concert: {
          ...concertWithDetails.concert,
          arena: {
            ...concertWithDetails.arena,
            zones: concertWithDetails.zones
          }
        },
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error fetching concert:', error);
      res.status(500).json({ 
        error: 'Failed to fetch concert',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/concerts/:id/zones
   * Get zones for a specific concert with availability and pricing
   */
  static async getConcertZones(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Concert ID is required' });
        return;
      }

      // Use ConcertService to get properly mapped data
      const concertWithDetails = await ConcertService.getConcertWithArenaDetails(id);
      if (!concertWithDetails) {
        res.status(404).json({ error: 'Concert not found' });
        return;
      }

      res.json({
        success: true,
        concert_id: concertWithDetails.concert.concert_id,
        arena_id: concertWithDetails.concert.arena_id,
        zones: concertWithDetails.zones,
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error fetching concert zones:', error);
      res.status(500).json({ 
        error: 'Failed to fetch zones',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/concerts/:id/zones/:zoneName/availability
   * Get real-time availability for a specific zone
   */
  static async getZoneAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id, zoneName } = req.params;
      
      if (!id || !zoneName) {
        res.status(400).json({ error: 'Concert ID and Zone Name are required' });
        return;
      }

      // Use ConcertService to get properly mapped zone availability
      const availability = await ConcertService.getZoneAvailability(id, zoneName);
      
      if (!availability) {
        res.status(404).json({ error: 'Concert or zone not found' });
        return;
      }

      res.json({
        success: true,
        ...availability,
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error fetching zone availability:', error);
      res.status(500).json({ 
        error: 'Failed to fetch zone availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/concerts/upcoming
   * Get upcoming concerts (future dates only)
   */
  static async getUpcomingConcerts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10, genre } = req.query;
      
      // Use ConcertService to get properly mapped upcoming concerts
      const upcomingConcerts = await ConcertService.getUpcomingConcerts(
        limit ? parseInt(limit as string) : undefined,
        genre as string
      );

      res.json({
        success: true,
        count: upcomingConcerts.length,
        total: upcomingConcerts.length,
        concerts: upcomingConcerts,
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error fetching upcoming concerts:', error);
      res.status(500).json({ 
        error: 'Failed to fetch upcoming concerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/concerts/organizer/:organizerId
   * Get concerts by organizer ID
   */
  static async getConcertsByOrganizer(req: Request, res: Response): Promise<void> {
    try {
      const { organizerId } = req.params;
      
      if (!organizerId) {
        res.status(400).json({ error: 'Organizer ID is required' });
        return;
      }

      const concerts = await ConcertService.getConcertsByOrganizer(organizerId);

      res.json({
        success: true,
        count: concerts.length,
        organizer_id: organizerId,
        concerts,
        database: DataService.getCurrentDatabaseType()
      });

    } catch (error) {
      console.error('Error fetching organizer concerts:', error);
      res.status(500).json({ 
        error: 'Failed to fetch organizer concerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 