-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS concert_zone_pricing CASCADE;
DROP TABLE IF EXISTS concert_features_artists CASCADE;
DROP TABLE IF EXISTS concerts CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS arenas CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS organizers CASCADE;
DROP TABLE IF EXISTS fans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (Parent entity for IS-A relationship)
CREATE TABLE users (
    user_id CHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    registration_date DATE DEFAULT CURRENT_DATE,
    last_login TIMESTAMP
);

-- Fans table (Child entity in IS-A relationship)
CREATE TABLE fans (
    user_id CHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    preferred_genre VARCHAR(100),
    phone_number VARCHAR(50),
    referral_code VARCHAR(100) UNIQUE NOT NULL,
    referred_by CHAR(36), -- New field for referral system
    referral_points INT DEFAULT 0, -- Points earned from referrals
    referral_code_used BOOLEAN DEFAULT FALSE, -- Flag to check if the referral code has been used
    -- when a fan is created, a referral code is generated and stored in the database
    -- when a fan is referred, the referred_by field is updated with the user_id of the referrer
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE, -- IS-A relationship
    FOREIGN KEY (referred_by) REFERENCES fans(user_id) -- Unary relationship
);

-- Organizers table (Child entity in IS-A relationship)
CREATE TABLE organizers (
    user_id CHAR(36) PRIMARY KEY,
    organization_name VARCHAR(255) NOT NULL,
    contact_info VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE -- IS-A relationship
);

-- Artists table remains the same
CREATE TABLE artists (
    artist_id CHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_name VARCHAR(255) NOT NULL,
    genre VARCHAR(100)
);

-- Arenas table remains the same
CREATE TABLE arenas (
    arena_id CHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    arena_name VARCHAR(255) NOT NULL,
    arena_location VARCHAR(255),
    total_capacity INT
);

-- Zones table remains the same
CREATE TABLE zones (
    arena_id CHAR(36),
    zone_name VARCHAR(100),
    capacity_per_zone INT,
    PRIMARY KEY (arena_id, zone_name),
    FOREIGN KEY (arena_id) REFERENCES arenas(arena_id)
);

-- Concerts table remains the same
CREATE TABLE concerts (
    concert_id CHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id CHAR(36),
    concert_date DATE NOT NULL,
    time TIME,
    description TEXT,
    arena_id CHAR(36),
    FOREIGN KEY (organizer_id) REFERENCES organizers(user_id),
    FOREIGN KEY (arena_id) REFERENCES arenas(arena_id)
);

-- Concert features artists table remains the same
CREATE TABLE concert_features_artists (
    concert_id CHAR(36),
    artist_id CHAR(36),
    PRIMARY KEY (concert_id, artist_id),
    FOREIGN KEY (concert_id) REFERENCES concerts(concert_id),
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id)
);

-- New table for concert zone pricing
CREATE TABLE concert_zone_pricing (
    concert_id CHAR(36),
    arena_id CHAR(36),
    zone_name VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (concert_id, arena_id, zone_name),
    FOREIGN KEY (concert_id) REFERENCES concerts(concert_id),
    FOREIGN KEY (arena_id, zone_name) REFERENCES zones(arena_id, zone_name)
);

-- Updated tickets table without purchase_price (price comes from concert_zone_pricing)
CREATE TABLE tickets (
    ticket_id CHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    fan_id CHAR(36),
    concert_id CHAR(36),
    arena_id CHAR(36),
    zone_name VARCHAR(100),
    purchase_price DECIMAL(10, 2) NOT NULL,
    purchase_date DATE,
    FOREIGN KEY (fan_id) REFERENCES fans(user_id),
    FOREIGN KEY (concert_id) REFERENCES concerts(concert_id),
    FOREIGN KEY (concert_id, arena_id, zone_name) REFERENCES concert_zone_pricing(concert_id, arena_id, zone_name)
);

-- Index for faster ticket lookups by fan_id
CREATE INDEX idx_tickets_fan_id ON tickets(fan_id);

-- Index for faster concert lookups by date
CREATE INDEX idx_concerts_date ON concerts(concert_date);

-- Index for faster price lookups
CREATE INDEX idx_concert_zone_pricing ON concert_zone_pricing(concert_id, arena_id);

-- Trigger to ensure concert dates are in the future
CREATE OR REPLACE FUNCTION check_concert_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.concert_date <= CURRENT_DATE THEN
        RAISE EXCEPTION 'Concert date must be in the future';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_future_concert_date
BEFORE INSERT OR UPDATE ON concerts
FOR EACH ROW
EXECUTE FUNCTION check_concert_date();


