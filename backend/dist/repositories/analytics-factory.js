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
exports.AnalyticsRepositoryFactory = void 0;
const migration_status_1 = require("../services/migration-status");
const analytics_1 = require("./postgres/analytics");
const analytics_2 = require("./mongodb/analytics");
class AnalyticsRepositoryFactory {
    static getRepository() {
        return __awaiter(this, void 0, void 0, function* () {
            const dbType = migration_status_1.migrationStatus.getDatabaseType();
            if (dbType === 'mongodb') {
                return analytics_2.MongoAnalyticsRepository.create();
            }
            return new analytics_1.PostgresAnalyticsRepository();
        });
    }
}
exports.AnalyticsRepositoryFactory = AnalyticsRepositoryFactory;
