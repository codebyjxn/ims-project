"use strict";
// src/dto/index.ts
// ========== DATA TRANSFER OBJECTS (DTOs) ==========
// These define the standard API response format
Object.defineProperty(exports, "__esModule", { value: true });
exports.DTOValidators = void 0;
// ========== UTILITY FUNCTIONS ==========
class DTOValidators {
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }
    static isFutureDate(dateString) {
        const date = new Date(dateString);
        return date > new Date();
    }
    static validateFanDTO(fan) {
        const errors = [];
        if (!fan.email || !this.isValidEmail(fan.email)) {
            errors.push('Valid email is required');
        }
        if (!fan.username || fan.username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }
        if (!fan.first_name || fan.first_name.trim().length === 0) {
            errors.push('First name is required');
        }
        if (!fan.last_name || fan.last_name.trim().length === 0) {
            errors.push('Last name is required');
        }
        return errors;
    }
    static validateConcertDTO(concert) {
        const errors = [];
        if (!concert.concert_date || !this.isValidDate(concert.concert_date)) {
            errors.push('Valid concert date is required');
        }
        else if (!this.isFutureDate(concert.concert_date)) {
            errors.push('Concert date must be in the future');
        }
        if (!concert.organizer_id) {
            errors.push('Organizer ID is required');
        }
        if (!concert.arena_id) {
            errors.push('Arena ID is required');
        }
        if (!concert.artists || concert.artists.length === 0) {
            errors.push('At least one artist is required');
        }
        return errors;
    }
}
exports.DTOValidators = DTOValidators;
