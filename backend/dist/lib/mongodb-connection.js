"use strict";
// src/lib/mongodb-connection.ts
// ========== MONGODB CONNECTION MANAGER ==========
// Robust connection management for MongoDB
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoManager = void 0;
const mongodb_1 = require("mongodb");
class MongoDBConnectionManager {
    constructor() {
        this.client = null;
        this.db = null;
        this.isConnecting = false;
        this.connectionPromise = null;
    }
    static getInstance() {
        if (!MongoDBConnectionManager.instance) {
            MongoDBConnectionManager.instance = new MongoDBConnectionManager();
        }
        return MongoDBConnectionManager.instance;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isConnected()) {
                return;
            }
            if (this.isConnecting && this.connectionPromise) {
                return this.connectionPromise;
            }
            this.isConnecting = true;
            this.connectionPromise = this.performConnection();
            try {
                yield this.connectionPromise;
            }
            finally {
                this.isConnecting = false;
                this.connectionPromise = null;
            }
        });
    }
    performConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
                const dbName = process.env.MONGODB_DB || 'concert_booking';
                this.client = new mongodb_1.MongoClient(mongoUrl);
                yield this.client.connect();
                this.db = this.client.db(dbName);
                console.log('Connected to MongoDB successfully');
            }
            catch (error) {
                console.error('Error connecting to MongoDB:', error);
                this.client = null;
                this.db = null;
                throw error;
            }
        });
    }
    isConnected() {
        return this.client !== null && this.db !== null;
    }
    getDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected()) {
                yield this.connect();
            }
            if (!this.db) {
                throw new Error('Database not connected after connection attempt');
            }
            return this.db;
        });
    }
    getCollection(collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            const database = yield this.getDatabase();
            return database.collection(collectionName);
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client) {
                yield this.client.close();
                this.client = null;
                this.db = null;
            }
        });
    }
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isConnected()) {
                    return false;
                }
                // Ping the database
                yield this.db.admin().ping();
                return true;
            }
            catch (error) {
                console.error('MongoDB health check failed:', error);
                return false;
            }
        });
    }
}
exports.mongoManager = MongoDBConnectionManager.getInstance();
