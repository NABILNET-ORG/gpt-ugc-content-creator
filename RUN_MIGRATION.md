# Run Database Migration

## 🚀 Quick Setup and Migration

### Prerequisites

You need Python 3.7+ installed on your system.

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

Or install psycopg2 directly:
```bash
pip install psycopg2-binary
```

### Step 2: Run Migration

```bash
python db-migrate.py
```

### Expected Output

```
============================================================
SUPABASE DATABASE MIGRATION TOOL
============================================================

[2025-11-17 ...] Connecting to Supabase...
[2025-11-17 ...] ✅ Connected to Supabase successfully

BEFORE MIGRATION:
============================================================
ALL TABLES IN PUBLIC SCHEMA
============================================================
  (No tables found)
============================================================

[2025-11-17 ...] Reading schema file: src/db/schema.sql
[2025-11-17 ...] ✅ Schema file read successfully (1849 characters)
[2025-11-17 ...] Starting database migration...
[2025-11-17 ...] ✅ Migration executed successfully

AFTER MIGRATION:
============================================================
ALL TABLES IN PUBLIC SCHEMA
============================================================
  📋 credits
  📋 payments
  📋 projects
  📋 users
  📋 videos
============================================================

============================================================
DATABASE AUDIT
============================================================
[2025-11-17 ...] ✅ Table 'users': 0 rows, 3 columns
[2025-11-17 ...] ✅ Table 'projects': 0 rows, 7 columns
[2025-11-17 ...] ✅ Table 'videos': 0 rows, 6 columns
[2025-11-17 ...] ✅ Table 'payments': 0 rows, 9 columns
[2025-11-17 ...] ✅ Table 'credits': 0 rows, 4 columns

------------------------------------------------------------
Checking Indexes...
------------------------------------------------------------
[2025-11-17 ...] Found 6 custom indexes:
[2025-11-17 ...]   ✅ idx_payments_session_id
[2025-11-17 ...]   ✅ idx_payments_user_id
[2025-11-17 ...]   ✅ idx_projects_user_id
[2025-11-17 ...]   ✅ idx_users_external_id
[2025-11-17 ...]   ✅ idx_videos_project_id
[2025-11-17 ...]   ✅ idx_videos_project_session

============================================================
AUDIT COMPLETE
============================================================

[2025-11-17 ...] Connection closed

============================================================
✅ MIGRATION COMPLETED SUCCESSFULLY
============================================================

Your Supabase database is now ready!
All API endpoints should now work correctly.
```

## What the Script Does

1. **Connects** to Supabase via Session Pooler
2. **Lists** existing tables (before migration)
3. **Reads** `src/db/schema.sql`
4. **Executes** all CREATE TABLE and CREATE INDEX statements
5. **Lists** tables (after migration)
6. **Audits** each table:
   - Verifies table exists
   - Counts rows
   - Counts columns
7. **Lists** all indexes created
8. **Reports** success/failure

## Safety Features

- ✅ Uses `IF NOT EXISTS` - safe to run multiple times
- ✅ Auto-commit mode for schema changes
- ✅ Detailed logging at each step
- ✅ Error handling with clear messages
- ✅ Comprehensive audit after migration

## Troubleshooting

### "Module not found: psycopg2"

Install it:
```bash
pip install psycopg2-binary
```

### "Connection refused" or "Timeout"

- Verify your internet connection
- Check Supabase project is active
- Verify connection string is correct

### "Permission denied"

- Verify you're using the correct database password
- Check Supabase project settings

### Script runs but shows errors

Read the error message carefully - it will show:
- Which SQL statement failed
- The exact error from PostgreSQL
- Line number in schema.sql (if applicable)

## After Migration

Test your API endpoints:

```bash
# Test prepare-assets (should work now)
curl -X POST https://gpt-ugc-content-creator.onrender.com/api/ugc/prepare-assets \
  -H "x-gpt-backend-secret: 7C5dJXv0rPpPp9sV_3qkL2wzA1mZBabA" \
  -H "Content-Type: application/json" \
  -d '{
    "userExternalId": "chatgpt:test",
    "productUrl": "https://www.amazon.com/dp/B0CX57B2V6",
    "selectedImageUrls": [],
    "avatarSettings": {},
    "tone": "enthusiastic",
    "targetAudience": "Gen Z",
    "platform": "tiktok"
  }'
```

Expected: Success with `projectId` and generated script!

---

**Run the migration now to fix all database-related endpoints!** 🚀
