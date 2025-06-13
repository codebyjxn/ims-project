"use strict";
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
exports.MongoAnalyticsRepository = void 0;
const mongodb_connection_1 = require("../../lib/mongodb-connection");
class MongoAnalyticsRepository {
    constructor(db) {
        this.concertsCollection = db.collection('concerts');
        this.ticketsCollection = db.collection('tickets');
        this.arenasCollection = db.collection('arenas');
    }
    static create() {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield mongodb_connection_1.mongoManager.getDatabase();
            if (!db) {
                throw new Error('Database not connected');
            }
            return new MongoAnalyticsRepository(db);
        });
    }
    getUpcomingConcertsPerformance() {
        return __awaiter(this, void 0, void 0, function* () {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const pipeline = [
                // 1. Filter for upcoming concerts
                {
                    $match: {
                        concert_date: { $gte: today }
                    }
                },
                // 2. Count tickets for each concert
                {
                    $lookup: {
                        from: 'tickets',
                        localField: '_id',
                        foreignField: 'concert_id',
                        as: 'sold_tickets'
                    }
                },
                // 3. Get arena details
                {
                    $lookup: {
                        from: 'arenas',
                        localField: 'arena_id',
                        foreignField: '_id',
                        as: 'arena_details'
                    }
                },
                // 4. Project the desired fields
                {
                    $project: {
                        _id: 0,
                        concert_id: '$_id',
                        concert_name: '$description', // Assuming description is the name
                        concert_date: { $dateToString: { format: "%Y-%m-%d", date: "$concert_date" } },
                        description: '$description',
                        arena_name: { $arrayElemAt: ['$arena_details.arena_name', 0] },
                        artists: {
                            $reduce: {
                                input: '$artists.artist_name',
                                initialValue: '',
                                in: {
                                    $cond: {
                                        if: { $eq: ['$$value', ''] },
                                        then: '$$this',
                                        else: { $concat: ['$$value', ', ', '$$this'] }
                                    }
                                }
                            }
                        },
                        tickets_sold: { $size: '$sold_tickets' }
                    }
                },
                // 5. Sort by tickets sold
                {
                    $sort: {
                        tickets_sold: -1
                    }
                }
            ];
            const result = yield this.concertsCollection.aggregate(pipeline).toArray();
            return result;
        });
    }
}
exports.MongoAnalyticsRepository = MongoAnalyticsRepository;
