// src/lib/mongodb-connection.ts
// ========== MONGODB CONNECTION MANAGER ==========
// Robust connection management for MongoDB

import { MongoClient, Db, Collection, Document } from 'mongodb';

class MongoDBConnectionManager {
  private static instance: MongoDBConnectionManager;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): MongoDBConnectionManager {
    if (!MongoDBConnectionManager.instance) {
      MongoDBConnectionManager.instance = new MongoDBConnectionManager();
    }
    return MongoDBConnectionManager.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected()) {
      return;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this.performConnection();
    
    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private async performConnection(): Promise<void> {
    try {
      const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const dbName = process.env.MONGODB_DB || 'concert_booking';
      
      this.client = new MongoClient(mongoUrl);
      await this.client.connect();
      this.db = this.client.db(dbName);
      
      console.log('Connected to MongoDB successfully');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      this.client = null;
      this.db = null;
      throw error;
    }
  }

  public isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }

  public async getDatabase(): Promise<Db> {
    if (!this.isConnected()) {
      await this.connect();
    }
    
    if (!this.db) {
      throw new Error('Database not connected after connection attempt');
    }
    
    return this.db;
  }

  public async getCollection<T extends Document = Document>(collectionName: string): Promise<Collection<T>> {
    const database = await this.getDatabase();
    return database.collection<T>(collectionName);
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        return false;
      }
      
      // Ping the database
      await this.db!.admin().ping();
      return true;
    } catch (error) {
      console.error('MongoDB health check failed:', error);
      return false;
    }
  }
}

export const mongoManager = MongoDBConnectionManager.getInstance(); 