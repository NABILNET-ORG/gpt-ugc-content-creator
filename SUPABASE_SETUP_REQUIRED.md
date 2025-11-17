# ⚠️ Supabase Database Setup Required

## 🚨 **Critical Issue**

The `/api/ugc/prepare-assets` endpoint is failing with:

```
PGRST205: Could not find the table 'public.users' in the schema cache
```

**Root Cause:** The database tables have NOT been created in your Supabase project yet.

---

## ✅ **Quick Fix (5 minutes)**

### Step 1: Go to Supabase SQL Editor

1. Open: **https://cflcjeupixrimucbyhit.supabase.co**
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Run the Database Schema

Copy the **ENTIRE** contents of `src/db/schema.sql` from your repository.

**The schema creates 5 tables:**
- `users` - User accounts with external IDs
- `projects` - UGC video projects
- `videos` - Generated videos
- `payments` - Stripe payment records
- `credits` - User credit balances

### Step 3: Execute

1. Paste the SQL into the query editor
2. Click **"Run"** or press `Ctrl+Enter`
3. Wait for success messages

**Expected output:**
```
✅ CREATE TABLE users
✅ CREATE TABLE projects
✅ CREATE TABLE videos
✅ CREATE TABLE payments
✅ CREATE TABLE credits
✅ CREATE INDEX (multiple)
```

### Step 4: Verify Tables Created

In Supabase:
1. Go to **"Table Editor"**
2. You should see all 5 tables listed
3. Click on `users` table - should show columns: `id`, `external_id`, `created_at`

---

## 📋 **Complete Schema**

Here's what will be created (from `src/db/schema.sql`):

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,  -- e.g. "chatgpt:nabil"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  avatar_settings JSONB,
  script_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INT,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid',
  plan TEXT,
  amount INT,
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  credits INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_external_id ON users(external_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_project_id ON videos(project_id);
CREATE INDEX IF NOT EXISTS idx_videos_project_session ON videos(project_id, stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
```

---

## 🧪 **Test After Setup**

Once you've run the schema:

### 1. Test prepare-assets endpoint:
```bash
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

**Expected:** Success response with `projectId` and generated script.

### 2. Check Supabase Table Editor:
- You should see a new row in the `users` table
- You should see a new row in the `projects` table

---

## 📊 **Current Status**

| Component | Status |
|-----------|--------|
| Scraping (ScraperAPI) | ✅ Working |
| AI Extraction (Gemini) | ✅ Working (needs multi-image tuning) |
| Database Schema | ❌ **NOT CREATED YET** |
| `/api/ugc/scrape-product` | ✅ Working |
| `/api/ugc/prepare-assets` | ❌ Fails (needs DB schema) |
| `/api/billing/*` | ❌ Needs DB schema |
| `/api/ugc/generate-video` | ❌ Needs DB schema |

---

## 🎯 **Action Required**

**Go to Supabase NOW and run the schema from `src/db/schema.sql`**

This is a one-time setup. After this:
- ✅ All endpoints will work
- ✅ User tracking will work
- ✅ Project management will work
- ✅ Billing will work
- ✅ Video generation will work

**Total time:** ~5 minutes

---

## 🔗 **Direct Links**

- **Supabase Project:** https://cflcjeupixrimucbyhit.supabase.co
- **SQL Editor:** https://cflcjeupixrimucbyhit.supabase.co/project/_/sql
- **Table Editor:** https://cflcjeupixrimucbyhit.supabase.co/project/_/editor
- **Schema File:** `src/db/schema.sql` in your repository

---

**Run the database schema and all endpoints will work! 🚀**
