"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationStatusManager = exports.migrationStatus = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
class MigrationStatusManager {
    constructor() {
        this.status = null;
        this.statusFile = path_1.default.resolve(config_1.config.migration.statusFile);
        this.loadStatus();
    }
    loadStatus() {
        var _a;
        try {
            if (fs_1.default.existsSync(this.statusFile)) {
                const data = fs_1.default.readFileSync(this.statusFile, 'utf8');
                this.status = JSON.parse(data);
                // Parse date string back to Date object
                if ((_a = this.status) === null || _a === void 0 ? void 0 : _a.migrationDate) {
                    this.status.migrationDate = new Date(this.status.migrationDate);
                }
            }
            else {
                // Default status if file doesn't exist
                this.status = {
                    migrated: false,
                    version: '1.0.0'
                };
                this.saveStatus();
            }
        }
        catch (error) {
            console.error('Error loading migration status:', error);
            // Fallback to default status
            this.status = {
                migrated: false,
                version: '1.0.0'
            };
        }
    }
    saveStatus() {
        try {
            // Ensure directory exists
            const dir = path_1.default.dirname(this.statusFile);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            fs_1.default.writeFileSync(this.statusFile, JSON.stringify(this.status, null, 2));
        }
        catch (error) {
            console.error('Error saving migration status:', error);
        }
    }
    /**
     * Check if migration has been completed
     */
    isMigrated() {
        var _a;
        // Check environment variable first, then file
        if (config_1.config.migration.migrated) {
            return true;
        }
        return ((_a = this.status) === null || _a === void 0 ? void 0 : _a.migrated) || false;
    }
    /**
     * Mark migration as completed
     */
    markMigrated() {
        this.status = {
            migrated: true,
            migrationDate: new Date(),
            version: '1.0.0'
        };
        this.saveStatus();
        console.log('Migration status marked as completed');
    }
    /**
     * Mark migration as not completed (rollback)
     */
    markNotMigrated() {
        this.status = {
            migrated: false,
            version: '1.0.0'
        };
        this.saveStatus();
        console.log('Migration status marked as not completed');
    }
    /**
     * Get current migration status
     */
    getStatus() {
        return Object.assign({}, this.status);
    }
    /**
     * Get database type based on migration status
     */
    getDatabaseType() {
        return this.isMigrated() ? 'mongodb' : 'postgresql';
    }
    /**
     * Reset migration status (for testing purposes)
     */
    reset() {
        if (fs_1.default.existsSync(this.statusFile)) {
            fs_1.default.unlinkSync(this.statusFile);
        }
        this.loadStatus();
    }
}
exports.MigrationStatusManager = MigrationStatusManager;
// Export singleton instance
exports.migrationStatus = new MigrationStatusManager();
