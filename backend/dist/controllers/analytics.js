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
exports.getUpcomingConcertsPerformance = void 0;
const analytics_factory_1 = require("../repositories/analytics-factory");
const getUpcomingConcertsPerformance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const analyticsRepo = yield analytics_factory_1.AnalyticsRepositoryFactory.getRepository();
        const performanceData = yield analyticsRepo.getUpcomingConcertsPerformance();
        res.status(200).json(performanceData);
    }
    catch (error) {
        console.error('Error fetching upcoming concerts performance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getUpcomingConcertsPerformance = getUpcomingConcertsPerformance;
