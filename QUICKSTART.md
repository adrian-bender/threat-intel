# Quick Start Guide

Get the Threat Intelligence API up and running in 5 minutes.

## Prerequisites Check

```bash
node --version  # Should be v16+
npm --version   # Should be 7+
```

## Step 1: Install Dependencies (if not already done)

```bash
cd /home/adrian/src/th
npm install
```

## Step 2: Create and Seed Database

```bash
# Install database dependencies
npm install --save-dev sqlite3 uuid

# Create and populate database with 10K indicators
node threat-intel/seed-database.js
```

Expected output:
```
Creating tables...
Seeding threat actors...
Seeding campaigns...
Seeding indicators...
Linking actors to campaigns...
Linking campaigns to indicators...
Creating indicator relationships...
Creating observations...
Database seeding completed successfully!
Database location: threat_intel.db
```

## Step 3: Start the Server

```bash
npm run start:dev
```

Expected output:
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] ThreatIntelModule dependencies initialized
[Nest] INFO Application is running on: http://localhost:8080
```

## Step 4: Test the API

### Option A: Using curl

```bash
# Test dashboard summary
curl http://localhost:8080/api/dashboard/summary?time_range=7d

# Search for IP indicators
curl "http://localhost:8080/api/indicators/search?type=ip&limit=5"
```

### Option B: Using your browser

Open: `http://localhost:8080/api/dashboard/summary`

### Option C: Get a specific indicator

First, get an indicator ID from the search:
```bash
curl "http://localhost:8080/api/indicators/search?limit=1" | jq '.data[0].id'
```

Then fetch its details:
```bash
curl http://localhost:8080/api/indicators/<INDICATOR_ID>
```

## Verify All Endpoints Work

```bash
# 1. Dashboard summary
curl http://localhost:8080/api/dashboard/summary

# 2. Search indicators
curl "http://localhost:8080/api/indicators/search?type=domain&limit=10"

# 3. Get specific indicator (use ID from search above)
curl http://localhost:8080/api/indicators/<ID>

# 4. Get campaign indicators (use campaign ID from indicator details)
curl http://localhost:8080/api/campaigns/<CAMPAIGN_ID>/indicators
```

## Common Issues

### "Cannot find module"
```bash
npm install
```

### "Database not found"
```bash
node threat-intel/seed-database.js
```

### "Port 8080 already in use"
Edit `main.ts` and change the port, or stop the conflicting process.

### TypeScript errors
These are expected for DTOs - they're populated at runtime. The app will still run correctly.

## Next Steps

- Read `README.md` for full API documentation
- Check `SQL_QUERIES.md` for query optimization details
- Review `ARCHITECTURE.md` for system design

## Sample API Workflow

```bash
# 1. Get overview of threats
curl http://localhost:8080/api/dashboard/summary?time_range=7d

# 2. Search for specific indicator type
curl "http://localhost:8080/api/indicators/search?type=ip&page=1&limit=20"

# 3. Get details of a suspicious IP
curl http://localhost:8080/api/indicators/<INDICATOR_ID>

# 4. Investigate the campaign it's associated with
curl http://localhost:8080/api/campaigns/<CAMPAIGN_ID>/indicators?group_by=day

# 5. Search for related indicators
curl "http://localhost:8080/api/indicators/search?campaign=<CAMPAIGN_ID>&limit=50"
```

## Performance Tips

- Use pagination (`limit` parameter) to avoid large result sets
- Cache dashboard summary results (they change infrequently)
- Use specific filters to narrow search results
- Consider adding indexes if queries are slow

## Success Criteria

✅ Server starts without errors  
✅ All 4 endpoints return valid JSON  
✅ Database contains 10,000 indicators  
✅ Search with pagination works  
✅ Related data is properly linked  

You're ready to build your threat intelligence dashboard! 🎉
