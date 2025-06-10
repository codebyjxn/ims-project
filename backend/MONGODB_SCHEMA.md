# MongoDB Schema Documentation
## Concert Booking System - NoSQL Implementation

This document outlines the MongoDB schema design for the Concert Booking System, detailing the rationale behind NoSQL-specific design decisions and optimizations.

## Overview

The MongoDB implementation uses **5 main collections** designed to optimize for the most common query patterns in a concert booking system. The design prioritizes:
- Fast concert discovery and booking
- Efficient fan ticket management
- Quick artist/venue searches
- Analytics and reporting performance

## Collection Design

### 1. Users Collection

**Purpose**: Unified collection for all user types (fans and organizers) with type-specific embedded documents.

```javascript
{
  _id: "uuid",                    // User ID from PostgreSQL
  email: "user@example.com",
  user_password: "hashed_password",
  first_name: "John",
  last_name: "Doe",
  registration_date: ISODate("2024-01-01T00:00:00Z"),
  last_login: ISODate("2024-01-15T10:30:00Z"),
  user_type: "fan",               // "fan" | "organizer"
  
  // Embedded when user_type = "fan"
  fan_details: {
    username: "johndoe123",
    preferred_genre: "Rock",
    phone_number: "+1-555-123-4567",
    referral_code: "JOHN2024",
    referred_by: "other_user_id",
    referral_points: 50,
    referral_code_used: false
  },
  
  // Embedded when user_type = "organizer"
  organizer_details: {
    organization_name: "Rock Events Inc",
    contact_info: "contact@rockevents.com"
  }
}
```

**Design Decisions**:
- ✅ **Single Collection**: Combines fans and organizers to avoid application-level joins
- ✅ **Conditional Embedding**: Type-specific details only when relevant
- ✅ **Referral System**: Self-referencing for fan referrals using `referred_by`

### 2. Artists Collection

**Purpose**: Simple artist catalog optimized for genre-based searches.

```javascript
{
  _id: "uuid",           // Artist ID from PostgreSQL
  artist_name: "The Beatles",
  genre: "Rock"
}
```

**Design Decisions**:
- ✅ **Minimal Structure**: Only essential fields to avoid over-normalization
- ✅ **Genre Indexing**: Optimized for genre-based artist discovery
- ✅ **Reference-Only**: Large artist details stored separately if needed

### 3. Arenas Collection

**Purpose**: Venue information with embedded zone configuration for capacity management.

```javascript
{
  _id: "uuid",               // Arena ID from PostgreSQL
  arena_name: "Madison Square Garden",
  arena_location: "New York, NY",
  total_capacity: 20000,
  
  // Embedded zones - always queried together
  zones: [
    {
      zone_name: "VIP",
      capacity_per_zone: 500
    },
    {
      zone_name: "General",
      capacity_per_zone: 19500
    }
  ]
}
```

**Design Decisions**:
- ✅ **Embedded Zones**: Zones always queried with arena for capacity planning
- ✅ **No Separate Zone Collection**: Eliminates joins for venue capacity queries
- ✅ **Immutable Design**: Zone configuration rarely changes after venue setup

### 4. Concerts Collection

**Purpose**: Concert events with strategic denormalization for booking and discovery.

```javascript
{
  _id: "uuid",                    // Concert ID from PostgreSQL
  concert_date: ISODate("2024-06-15T00:00:00Z"),
  time: "19:30",
  description: "Greatest Hits Tour",
  organizer_id: "organizer_uuid", // Reference to Users collection
  arena_id: "arena_uuid",         // Reference to Arenas collection
  
  // Embedded artists - frequently accessed for display
  artists: [
    {
      artist_id: "artist_uuid",
      artist_name: "The Beatles",
      genre: "Rock"
    }
  ],
  
  // Embedded pricing - essential for ticket booking
  zone_pricing: [
    {
      zone_name: "VIP",
      price: 250.00
    },
    {
      zone_name: "General", 
      price: 75.00
    }
  ]
}
```

**Design Decisions**:
- ✅ **Artist Embedding**: Artist names/genres needed for concert listings
- ✅ **Price Embedding**: Pricing essential for booking flow performance
- ✅ **Organizer/Arena References**: Large, infrequently changing data
- ✅ **Date Optimization**: Indexed for temporal queries and filtering

### 5. Tickets Collection

**Purpose**: Transaction records with selective denormalization for analytics and user queries.

```javascript
{
  _id: "uuid",                    // Ticket ID from PostgreSQL
  fan_id: "fan_user_id",         // Reference to Users collection
  concert_id: "concert_uuid",     // Reference to Concerts collection
  arena_id: "arena_uuid",         // Reference to Arenas collection
  zone_name: "VIP",
  purchase_date: ISODate("2024-01-10T14:20:00Z"),
  referral_code_used: false,
  
  // Denormalized for query performance
  concert_date: ISODate("2024-06-15T00:00:00Z"),  // Date-based analytics
  fan_username: "johndoe123",                      // Fan ticket lookup
  price: 250.00                                    // Revenue reporting
}
```

**Design Decisions**:
- ✅ **Strategic Denormalization**: Only frequently queried fields
- ✅ **Analytics Optimization**: Pre-computed fields for reporting
- ✅ **Fan Experience**: Quick "my tickets" queries without joins

## Indexing Strategy

### Performance-Critical Indexes

```javascript
// Users Collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ user_type: 1 })
db.users.createIndex({ "fan_details.username": 1 }, { sparse: true, unique: true })
db.users.createIndex({ "fan_details.preferred_genre": 1 })
db.users.createIndex({ "fan_details.referral_code": 1 }, { sparse: true, unique: true })

// Artists Collection  
db.artists.createIndex({ genre: 1 })
db.artists.createIndex({ artist_name: 1 })

// Arenas Collection
db.arenas.createIndex({ arena_location: 1 })

// Concerts Collection
db.concerts.createIndex({ concert_date: 1 })
db.concerts.createIndex({ organizer_id: 1 })
db.concerts.createIndex({ arena_id: 1 })
db.concerts.createIndex({ "artists.genre": 1 })
db.concerts.createIndex({ concert_date: 1, arena_id: 1 })  // Compound

// Tickets Collection
db.tickets.createIndex({ fan_id: 1 })
db.tickets.createIndex({ concert_id: 1 })
db.tickets.createIndex({ purchase_date: 1 })
db.tickets.createIndex({ concert_date: 1 })
db.tickets.createIndex({ fan_id: 1, concert_date: 1 })      // Compound
db.tickets.createIndex({ concert_id: 1, zone_name: 1 })     // Compound
```

## Query Optimization Patterns

### 1. Concert Discovery
```javascript
// Find rock concerts in next 30 days
db.concerts.find({
  "artists.genre": "Rock",
  concert_date: { 
    $gte: new Date(), 
    $lte: new Date(Date.now() + 30*24*60*60*1000) 
  }
})
```

### 2. Fan Ticket History
```javascript
// Get all tickets for a fan with concert details
db.tickets.find({ fan_id: "fan_uuid" })
// No joins needed - concert_date and fan_username embedded
```

### 3. Revenue Analytics
```javascript
// Monthly revenue by genre
db.tickets.aggregate([
  {
    $lookup: {
      from: "concerts",
      localField: "concert_id", 
      foreignField: "_id",
      as: "concert"
    }
  },
  {
    $group: {
      _id: "$concert.artists.genre",
      total_revenue: { $sum: "$price" }
    }
  }
])
```

### 4. Venue Utilization
```javascript
// Tickets sold by zone for capacity planning
db.tickets.aggregate([
  {
    $group: {
      _id: { arena_id: "$arena_id", zone_name: "$zone_name" },
      tickets_sold: { $sum: 1 },
      revenue: { $sum: "$price" }
    }
  }
])
```

## Design Trade-offs and Justifications

### Embedding vs Referencing Decisions

| Data | Strategy | Reasoning |
|------|----------|-----------|
| **Zones in Arenas** | Embedded | Always queried together, immutable |
| **Artists in Concerts** | Embedded | Essential for display, manageable size |
| **Pricing in Concerts** | Embedded | Critical for booking performance |
| **Organizer in Concerts** | Referenced | Large data, infrequently accessed |
| **Arena in Concerts** | Referenced | Detailed venue info not always needed |

### Denormalization Choices

| Field | Copied To | Benefit | Trade-off |
|-------|-----------|---------|-----------|
| `concert_date` | Tickets | Fast date filtering | Data duplication |
| `fan_username` | Tickets | Quick user lookup | Storage overhead |
| `price` | Tickets | Direct revenue queries | Potential inconsistency |
| `artist_name` | Concerts | Display performance | Artist updates require cascade |

### Consistency Considerations

1. **Artist Updates**: Require cascade updates to concerts collection
2. **Price Changes**: Historical ticket prices preserved (business requirement)
3. **Zone Configuration**: Arena zone changes require manual data migration
4. **User Type Changes**: Fan ↔ Organizer transitions need document restructuring

## Migration from SQL

The schema preserves all original SQL relationships while optimizing for NoSQL patterns:

- **Primary Keys**: All SQL UUIDs become MongoDB `_id` fields
- **Foreign Keys**: Maintained as reference fields where beneficial
- **Junction Tables**: `concert_features_artists` embedded into concerts
- **Lookup Tables**: `concert_zone_pricing` embedded into concerts
- **Self-References**: Fan referrals maintained using `referred_by` field

## Scalability Considerations

### Horizontal Scaling Strategies
- **Shard Key**: `fan_id` for tickets collection (user-based queries)
- **Geographic**: Arena location for regional deployment
- **Temporal**: Date-based sharding for time-series data

### Performance Monitoring
- Index utilization on compound queries
- Document size growth (especially concerts with many artists)
- Write performance on embedded array updates

## Conclusion

This MongoDB schema design prioritizes:
1. **Read Performance**: Strategic denormalization for common queries
2. **Business Logic**: Embedding patterns match access patterns  
3. **Scalability**: Compound indexes and sharding considerations
4. **Maintainability**: Clear separation of concerns despite NoSQL flexibility

The design demonstrates deep understanding of NoSQL principles while maintaining data integrity and query performance for a real-world concert booking system. 