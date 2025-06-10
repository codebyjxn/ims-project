import { DatabaseFactory, DatabaseResult } from '../lib/database-factory';

export class DataService {
  /**
   * Get all users from the active database
   */
  static async getAllUsers(): Promise<any[]> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.getUsers();
    return result.rows || result.data || [];
  }

  /**
   * Get user by ID from the active database
   */
  static async getUserById(id: string): Promise<any | null> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.getUserById(id);
    const data = result.rows || result.data || [];
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Create a new user in the active database
   */
  static async createUser(userData: any): Promise<any> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.createUser(userData);
    const data = result.rows || result.data || [];
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Update user in the active database
   */
  static async updateUser(id: string, updates: any): Promise<any | null> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.updateUser(id, updates);
    const data = result.rows || result.data || [];
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Delete user from the active database
   */
  static async deleteUser(id: string): Promise<boolean> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.deleteUser(id);
    const data = result.rows || result.data || [];
    return data.length > 0;
  }

  /**
   * Get all artists from the active database
   */
  static async getAllArtists(): Promise<any[]> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.getArtists();
    return result.rows || result.data || [];
  }

  /**
   * Get artist by ID from the active database
   */
  static async getArtistById(id: string): Promise<any | null> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.getArtistById(id);
    const data = result.rows || result.data || [];
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Create a new artist in the active database
   */
  static async createArtist(artistData: any): Promise<any> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.createArtist(artistData);
    const data = result.rows || result.data || [];
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Get all arenas from the active database
   */
  static async getAllArenas(): Promise<any[]> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.getArenas();
    return result.rows || result.data || [];
  }

  /**
   * Get arena by ID from the active database
   */
  static async getArenaById(id: string): Promise<any | null> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.getArenaById(id);
    const data = result.rows || result.data || [];
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Create a new arena in the active database
   */
  static async createArena(arenaData: any): Promise<any> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.createArena(arenaData);
    const data = result.rows || result.data || [];
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Get all concerts from the active database
   */
  static async getAllConcerts(): Promise<any[]> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.getConcerts();
    return result.rows || result.data || [];
  }

  /**
   * Get concert by ID from the active database
   */
  static async getConcertById(id: string): Promise<any | null> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.getConcertById(id);
    const data = result.rows || result.data || [];
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Create a new concert in the active database
   */
  static async createConcert(concertData: any): Promise<any> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.createConcert(concertData);
    const data = result.rows || result.data || [];
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Get all tickets from the active database
   */
  static async getAllTickets(): Promise<any[]> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.getTickets();
    return result.rows || result.data || [];
  }

  /**
   * Get ticket by ID from the active database
   */
  static async getTicketById(id: string): Promise<any | null> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.getTicketById(id);
    const data = result.rows || result.data || [];
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Get tickets by user ID from the active database
   */
  static async getTicketsByUserId(userId: string): Promise<any[]> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.getTicketsByUserId(userId);
    return result.rows || result.data || [];
  }

  /**
   * Create a new ticket in the active database
   */
  static async createTicket(ticketData: any): Promise<any> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.createTicket(ticketData);
    const data = result.rows || result.data || [];
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Get database statistics from the active database
   */
  static async getStats(): Promise<any> {
    const adapter = DatabaseFactory.getAdapter();
    return await adapter.getStats();
  }

  /**
   * Get current database type
   */
  static getCurrentDatabaseType(): 'postgresql' | 'mongodb' {
    return DatabaseFactory.getCurrentDatabaseType();
  }

  /**
   * Check if system is migrated
   */
  static isMigrated(): boolean {
    return DatabaseFactory.isMigrated();
  }

  /**
   * Get adapter directly (for advanced operations)
   */
  static getAdapter(): any {
    return DatabaseFactory.getAdapter();
  }

  // ========== REFERRAL SYSTEM METHODS ==========

  /**
   * Get user by referral code
   */
  static async getUserByReferralCode(referralCode: string): Promise<any | null> {
    const adapter = DatabaseFactory.getAdapter();
    const result = await adapter.getUserByReferralCode(referralCode);
    const data = result.rows || result.data || [];
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Update user referral points
   */
  static async updateUserReferralPoints(userId: string, pointsToAdd: number): Promise<void> {
    const adapter = DatabaseFactory.getAdapter();
    await adapter.updateUserReferralPoints(userId, pointsToAdd);
  }

  /**
   * Mark referral code as used for a fan
   */
  static async markReferralCodeUsed(fanId: string): Promise<void> {
    const adapter = DatabaseFactory.getAdapter();
    await adapter.markReferralCodeUsed(fanId);
  }

  /**
   * Update fan's referrer
   */
  static async updateFanReferrer(fanId: string, referrerId: string): Promise<void> {
    const adapter = DatabaseFactory.getAdapter();
    await adapter.updateFanReferrer(fanId, referrerId);
  }
} 