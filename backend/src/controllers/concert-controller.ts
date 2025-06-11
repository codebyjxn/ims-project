import { Request, Response } from 'express';
import { DataService } from '../services/data-service';
import { ConcertService } from '../services/concert-service';

export class ConcertController {

  /**
   * Get all concerts with filtering and pagination
   */
  async getConcerts(req: Request, res: Response): Promise<void> {
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
        filteredConcerts = filteredConcerts.filter((concert: any) => 
          concert.arena_location?.toLowerCase().includes((city as string).toLowerCase())
        );
      }
      
      if (date) {
        const filterDate = new Date(date as string);
        filteredConcerts = filteredConcerts.filter((concert: any) => {
          const concertDate = new Date(concert.concert_date);
          return concertDate.toDateString() === filterDate.toDateString();
        });
      }
      
      if (genre) {
        filteredConcerts = filteredConcerts.filter((concert: any) => {
          // Handle both PostgreSQL JSON array and MongoDB array formats
          let artists = concert.artists;
          
          // If artists is a string (PostgreSQL JSON), parse it
          if (typeof artists === 'string') {
            try {
              artists = JSON.parse(artists);
            } catch (e) {
              return false;
            }
          }
          
          // Check if artists is an array and filter
          return Array.isArray(artists) && artists.some((artist: any) => 
            artist.genre?.toLowerCase().includes((genre as string).toLowerCase())
          );
        });
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
   * Get concert details by ID including zone information and availability
   */
  async getConcertById(req: Request, res: Response): Promise<void> {
    try {
      const { concertId } = req.params;
      
      if (!concertId) {
        res.status(400).json({ error: 'Concert ID is required' });
        return;
      }

      // Use ConcertService to get properly mapped data
      const concertWithDetails = await ConcertService.getConcertWithArenaDetails(concertId);
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
   * Get zones for a specific concert with availability and pricing
   */
  async getConcertZones(req: Request, res: Response): Promise<void> {
    try {
      const { concertId } = req.params;
      
      if (!concertId) {
        res.status(400).json({ error: 'Concert ID is required' });
        return;
      }

      // Use ConcertService to get properly mapped data
      const concertWithDetails = await ConcertService.getConcertWithArenaDetails(concertId);
      if (!concertWithDetails) {
        res.status(404).json({ error: 'Concert not found' });
        return;
      }

      res.json({
        success: true,
        concertId: concertWithDetails.concert.concert_id,
        arenaId: concertWithDetails.concert.arena_id,
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
   * Get real-time availability for a specific zone
   */
  async getZoneAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { concertId, zoneId } = req.params;
      
      if (!concertId || !zoneId) {
        res.status(400).json({ error: 'Concert ID and Zone ID are required' });
        return;
      }

      // Use ConcertService to get properly mapped zone availability
      const availability = await ConcertService.getZoneAvailability(concertId, zoneId);
      
      if (!availability) {
        res.status(404).json({ error: 'Concert or zone not found' });
        return;
      }

      res.json({
        success: true,
        concertId: availability.concert_id,
        zoneId: availability.zone_name,
        availability,
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
   * Get upcoming concerts (future dates only)
   */
  async getUpcomingConcerts(req: Request, res: Response): Promise<void> {
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

  // Private helper methods

  private async getZonesWithAvailability(concertId: string, arena: any): Promise<any[]> {
    const currentDb = DataService.getCurrentDatabaseType();
    
    if (currentDb === 'mongodb') {
      // For MongoDB, zones are embedded in arena document
      const zones = arena.zones || [];
      const concert = await DataService.getConcertById(concertId);
      
      const zonesWithInfo = await Promise.all(zones.map(async (zone: any) => {
        const availability = await this.getZoneAvailabilityInfo(concertId, zone.zone_name);
        const pricing = concert.zone_pricing?.find((p: any) => p.zone_name === zone.zone_name);
        
        return {
          ...zone,
          price: pricing?.price || 0,
          availableTickets: availability.availableTickets,
          soldTickets: availability.soldTickets,
          availabilityPercentage: availability.availabilityPercentage
        };
      }));
      
      return zonesWithInfo;
    } else {
      // For PostgreSQL, get zones from zones table and pricing from concert_zone_pricing
      const adapter = DataService.getAdapter();
      const result = await adapter.query(`
        SELECT 
          z.zone_name,
          z.capacity_per_zone,
          COALESCE(czp.price, 0) as price,
          COUNT(t.ticket_id) as sold_tickets
        FROM zones z
        LEFT JOIN concert_zone_pricing czp ON z.arena_id = czp.arena_id AND z.zone_name = czp.zone_name AND czp.concert_id = $1
        LEFT JOIN tickets t ON t.concert_id = $1 AND t.zone_name = z.zone_name
        WHERE z.arena_id = $2
        GROUP BY z.zone_name, z.capacity_per_zone, czp.price
        ORDER BY z.zone_name
      `, [concertId, arena.arena_id]);

      return result.rows?.map((row: any) => {
        const soldTickets = parseInt(row.sold_tickets) || 0;
        const availableTickets = Math.max(0, row.capacity_per_zone - soldTickets);
        const availabilityPercentage = row.capacity_per_zone > 0 ? 
          (availableTickets / row.capacity_per_zone) * 100 : 0;

        return {
          zone_name: row.zone_name,
          capacity_per_zone: row.capacity_per_zone,
          price: parseFloat(row.price) || 0,
          availableTickets,
          soldTickets,
          availabilityPercentage: Math.round(availabilityPercentage)
        };
      }) || [];
    }
  }

  private async getZoneAvailabilityInfo(concertId: string, zoneName: string): Promise<any> {
    const currentDb = DataService.getCurrentDatabaseType();
    
    if (currentDb === 'mongodb') {
      const concert = await DataService.getConcertById(concertId);
      if (!concert) return { exists: false };

      const arena = await DataService.getArenaById(concert.arena_id);
      const zone = arena?.zones?.find((z: any) => z.zone_name === zoneName);
      
      if (!zone) return { exists: false };

      // Count sold tickets for this zone
      const adapter = DataService.getAdapter();
      const ticketResult = await adapter.getTicketsByConcertAndZone(concertId, zoneName);
      const soldTickets = ticketResult.data?.length || 0;
      
      const availableTickets = Math.max(0, zone.capacity_per_zone - soldTickets);
      const availabilityPercentage = zone.capacity_per_zone > 0 ? 
        (availableTickets / zone.capacity_per_zone) * 100 : 0;

      const pricing = concert.zone_pricing?.find((p: any) => p.zone_name === zoneName);

      return {
        exists: true,
        totalCapacity: zone.capacity_per_zone,
        availableTickets,
        soldTickets,
        availabilityPercentage: Math.round(availabilityPercentage),
        price: pricing?.price || 0
      };
    } else {
      // PostgreSQL
      const adapter = DataService.getAdapter();
      const result = await adapter.query(`
        SELECT 
          z.capacity_per_zone,
          COALESCE(czp.price, 0) as price,
          COUNT(t.ticket_id) as sold_tickets
        FROM zones z
        LEFT JOIN concert_zone_pricing czp ON z.arena_id = czp.arena_id AND z.zone_name = czp.zone_name AND czp.concert_id = $1
        LEFT JOIN tickets t ON t.concert_id = $1 AND t.zone_name = z.zone_name
        JOIN concerts c ON c.arena_id = z.arena_id
        WHERE c.concert_id = $1 AND z.zone_name = $2
        GROUP BY z.capacity_per_zone, czp.price
      `, [concertId, zoneName]);

      if (!result.rows || result.rows.length === 0) {
        return { exists: false };
      }

      const row = result.rows[0];
      const soldTickets = parseInt(row.sold_tickets) || 0;
      const availableTickets = Math.max(0, row.capacity_per_zone - soldTickets);
      const availabilityPercentage = row.capacity_per_zone > 0 ? 
        (availableTickets / row.capacity_per_zone) * 100 : 0;

      return {
        exists: true,
        totalCapacity: row.capacity_per_zone,
        availableTickets,
        soldTickets,
        availabilityPercentage: Math.round(availabilityPercentage),
        price: parseFloat(row.price) || 0
      };
    }
  }
}

// Export controller functions for routes
const concertController = new ConcertController();

export const getConcerts = concertController.getConcerts.bind(concertController);
export const getConcertById = concertController.getConcertById.bind(concertController);
export const getConcertZones = concertController.getConcertZones.bind(concertController);
export const getZoneAvailability = concertController.getZoneAvailability.bind(concertController);
export const getUpcomingConcerts = concertController.getUpcomingConcerts.bind(concertController);