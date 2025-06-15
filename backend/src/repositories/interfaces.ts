// src/repositories/interfaces.ts
// ========== REPOSITORY INTERFACES ==========
// These define the contract for data access, implemented by both PostgreSQL and MongoDB repositories

export interface IUserRepository {
  findById(userId: string): Promise<any | null>;
  findByEmail(email: string): Promise<any | null>;
  findFanByUsername(username: string): Promise<any | null>;
  findFanByReferralCode(referralCode: string): Promise<any | null>;
  create(userData: any): Promise<any>;
  update(userId: string, updates: any): Promise<any | null>;
  delete(userId: string): Promise<boolean>;
  updateReferralPoints(userId: string, points: number): Promise<void>;
  markReferralCodeUsed(fanId: string): Promise<void>;
  setReferrer(fanId: string, referrerId: string): Promise<void>;
}

export interface IArtistRepository {
  findById(artistId: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  findByGenre(genre: string): Promise<any[]>;
  create(artistData: any): Promise<any>;
  update(artistId: string, updates: any): Promise<any | null>;
  delete(artistId: string): Promise<boolean>;
}

export interface IArenaRepository {
  findById(arenaId: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  findByLocation(location: string): Promise<any[]>;
  create(arenaData: any): Promise<any>;
  update(arenaId: string, updates: any): Promise<any | null>;
  delete(arenaId: string): Promise<boolean>;
  findZones(arenaId: string): Promise<any[]>;
}

export interface IConcertRepository {
  findById(concertId: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  findByDate(date: Date): Promise<any[]>;
  findByOrganizer(organizerId: string): Promise<any[]>;
  findByArtist(artistId: string): Promise<any[]>;
  create(concertData: any): Promise<any>;
  update(concertId: string, updates: any): Promise<any | null>;
  delete(concertId: string): Promise<boolean>;
  findZonePricing(concertId: string, arenaId: string, zoneName: string): Promise<any | null>;
  findAvailableTickets(concertId: string, zoneName: string): Promise<number>;
  findUpcoming?(): Promise<any[]>;
}

export interface ITicketRepository {
  findById(ticketId: string): Promise<any | null>;
  findByFan(fanId: string): Promise<any[]>;
  findByConcert(concertId: string): Promise<any[]>;
  findByConcertAndZone(concertId: string, zoneName: string): Promise<any[]>;
  create(ticketData: any): Promise<any>;
  createMultiple(ticketsData: any[]): Promise<any[]>;
  delete(ticketId: string): Promise<boolean>;
  countByConcertAndZone(concertId: string, zoneName: string): Promise<number>;
}

export interface IOrganizerRepository {
  findConcertsByOrganizer(organizerId: string): Promise<any[]>;
  getStats(organizerId: string): Promise<any>;
  getArenas(): Promise<any[]>;
  getArtists(): Promise<any[]>;
  createConcert(concertData: any): Promise<any>;
  getArenasAnalytics(organizerId: string): Promise<any[]>;
}

export interface IRepositoryFactory {
  getUserRepository(): IUserRepository;
  getArtistRepository(): IArtistRepository;
  getArenaRepository(): IArenaRepository;
  getConcertRepository(): IConcertRepository;
  getTicketRepository(): ITicketRepository;
} 