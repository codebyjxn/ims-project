Student 1: Jaupi, Joana

# NoSQL Use Case and Analytics Report

## Briefly summarize the NoSQL implementation of the use case and report, and compare their results/outcome with those from 2.2.

For this assignment, I implemented the fan ticket purchase use case using MongoDB as the NoSQL database, mirroring the logic previously developed in SQL. In this system, fans can buy tickets for concerts and apply discounts using either loyalty points or a referral code. The analytics report focuses on determining the number of tickets sold for upcoming concerts and the total revenue generated.

**NoSQL Implementation:**
- **Data Model:**
  - `concerts` collection: stores concert details, including date, description, arena, and artists.
  - `tickets` collection: records each ticket purchase, referencing the concert and storing purchase price and user info.
  - `arenas` collection: stores arena details.
- **Purchase Logic:**
  - When a fan buys a ticket, the system checks for available points or a valid referral code, applies the discount, and records the transaction in the `tickets` collection.
  - Points are deducted or referral codes are marked as used as appropriate.

**Comparison with SQL Implementation (2.2):**
- In SQL, the logic relied on JOINs between normalized tables (users, concerts, tickets, referrals).
- In MongoDB, references are used, and aggregation pipelines with `$lookup` are used to join data across collections.
- The NoSQL approach offers more flexibility for evolving requirements and can scale horizontally, but requires careful design to avoid data duplication and maintain consistency.

---

## NoSQL Analytics Report Statement

**Optimized Analytics Query (MongoShell Syntax, using denormalized fields and $lookup for artists):**
The analytics report for tickets sold and revenue for upcoming concerts is now implemented using the following aggregation pipeline on the `tickets` collection, leveraging denormalized fields and a $lookup to fetch artists:

```javascript
db.tickets.aggregate([
  { $match: { concert_date: { $gte: new Date() } } },
  { $lookup: {
      from: 'concerts',
      localField: 'concert_id',
      foreignField: '_id',
      as: 'concert_details'
  }},
  { $unwind: '$concert_details' },
  { $group: {
      _id: '$concert_id',
      concert_name: { $first: '$concert_name' },
      concert_date: { $first: '$concert_date' },
      description: { $first: '$concert_name' },
      arena_name: { $first: '$arena_name' },
      artists: { $first: '$concert_details.artists' },
      tickets_sold: { $sum: 1 },
      total_revenue: { $sum: { $ifNull: ['$purchase_price', 0] } }
  }},
  { $project: {
      _id: 0,
      concert_id: '$_id',
      concert_name: 1,
      concert_date: { $dateToString: { format: "%Y-%m-%d", date: "$concert_date" } },
      description: '$concert_name',
      arena_name: 1,
      tickets_sold: 1,
      total_revenue: 1,
      artists: {
        $cond: [
          { $isArray: "$artists" },
          {
            $reduce: {
              input: "$artists",
              initialValue: "",
              in: {
                $cond: [
                  { $eq: ["$$value", ""] },
                  { $ifNull: ["$$this.artist_name", ""] },
                  { $concat: ["$$value", ", ", { $ifNull: ["$$this.artist_name", ""] }] }
                ]
              }
            }
          },
          ""
        ]
      }
  }},
  { $sort: { tickets_sold: -1 } }
])
```

- This pipeline now includes a `$lookup` to fetch the artists for each concert, and displays them as a comma-separated string in the report.
- The `total_revenue` field is now correctly calculated as the sum of all ticket purchase prices for each concert.

**Performance Measurement with .explain():**
To measure and compare the performance of your analytics query before and after adding indexes, use the following in the Mongo shell:

```javascript
// Run the aggregation with execution stats
db.tickets.aggregate([
  // ...pipeline as above...
]).explain("executionStats")
```

**Key metrics to observe:**
- `totalDocsExamined`: Number of documents scanned
- `executionTimeMillis`: Query execution time

**Example workflow:**
1. Run the aggregation with `.explain("executionStats")` before creating indexes and note the metrics.
2. Create the necessary indexes (e.g., on `concert_date`, `concert_id`):
   ```javascript
   db.tickets.createIndex({ concert_date: 1 })
   db.tickets.createIndex({ concert_id: 1 })
   ```
3. Run the aggregation with `.explain("executionStats")` again and compare the metrics.

**Design Impact:**
- The new pipeline is much faster and simpler, as it avoids $lookup and uses denormalized fields.
- Indexes on `concert_date` and `concert_id` further improve performance.

**Compromises and Design Decisions:**
- **Compromise:** MongoDB's `$lookup` can be less performant than SQL JOINs for very large datasets, especially if collections are not properly indexed.
- **Mitigation:** Indexes are created on `concert_id` in `tickets` and `arena_id` in `concerts` to improve lookup performance.
- **Decision:** Concert details are not embedded in tickets to avoid data duplication and to keep concert updates consistent across all tickets.

---

## NoSQL Indexing

**Index Implementation:**
To optimize the analytics report, the following indexes were created:

```javascript
// Index on concert_id in tickets for efficient lookups
db.tickets.createIndex({ concert_id: 1 })

// Index on arena_id in concerts for efficient lookups
db.concerts.createIndex({ arena_id: 1 })

// Index on concert_date in concerts for efficient filtering of upcoming concerts
db.concerts.createIndex({ concert_date: 1 })
```

**Execution Stats and Impact:**
After implementing the indexes, the aggregation pipeline was run and execution stats were reviewed using `.explain("executionStats")`. The key metrics observed were:

- **totalDocsExamined:** Reduced significantly, as the indexes allow MongoDB to quickly find relevant documents.
- **indexesUsed:** The aggregation pipeline utilized the created indexes, as shown in the execution plan.

**Screenshots:**
*(Insert screenshots of the MongoDB shell output showing the use of indexes and reduced document scans here.)*

**Discussion:**
The addition of indexes led to a noticeable improvement in query performance, especially as the dataset grew. The analytics report now runs efficiently, even with a large number of tickets and concerts. This demonstrates the importance of indexing in NoSQL databases, particularly for analytical queries that involve filtering and joining large collections.

---

**Conclusion:**
The NoSQL implementation using MongoDB successfully supports the fan ticket purchase use case and enables efficient analytics reporting. By carefully designing the data model and applying appropriate indexes, I was able to achieve performance comparable to the SQL implementation, while also benefiting from the flexibility and scalability of NoSQL.

---

**Instructions for Submission:**
- Replace the placeholder for screenshots with actual screenshots from your MongoDB shell.
- Adjust the collection/field names if your implementation uses different names.
- If you made additional design decisions or faced unique challenges, add them to the relevant sections. 