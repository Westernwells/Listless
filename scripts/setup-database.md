# Database Setup Instructions

After creating your Supabase project and configuring environment variables, follow these steps to set up your database schema:

## Method 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor** (in the left sidebar)
3. **Run the migration files in this exact order:**

### Step 1: Initial Schema
- Copy the contents of `supabase/migrations/001_initial_schema.sql`
- Paste into SQL Editor and click "Run"
- This creates all tables, indexes, and the pgvector extension

### Step 2: Row Level Security
- Copy the contents of `supabase/migrations/002_rls_policies.sql`
- Paste into SQL Editor and click "Run"
- This enables RLS and creates security policies

### Step 3: Database Functions
- Copy the contents of `supabase/migrations/003_functions.sql`
- Paste into SQL Editor and click "Run"
- This creates AI functions and utilities

### Step 4: Triggers
- Copy the contents of `supabase/migrations/004_triggers.sql`
- Paste into SQL Editor and click "Run"
- This creates automatic triggers for timestamps and validation

### Step 5: Seed Data (Optional)
- Copy the contents of `supabase/seed.sql`
- Paste into SQL Editor and click "Run"
- This creates default data for development

## Method 2: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (get project ref from dashboard URL)
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

## Verification Steps

After running the migrations, verify everything is set up correctly:

### 1. Check Tables
In SQL Editor, run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- action_history
- areas
- billing_details
- connected_accounts
- project_lists
- subscriptions
- tags
- task_tags
- tasks
- user_settings
- users

### 2. Check pgvector Extension
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

Should return one row showing the vector extension is installed.

### 3. Check RLS Policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

Should show multiple policies for each table.

### 4. Test Vector Indexes
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'tasks' 
AND indexname LIKE '%embedding%';
```

Should show the HNSW and IVFFlat vector indexes.

## Troubleshooting

### Common Issues:

1. **pgvector extension error**: 
   - Make sure you're using a Supabase project (not local PostgreSQL)
   - The extension should be available by default

2. **Permission errors**:
   - Make sure you're using the SQL Editor in your Supabase dashboard
   - Don't run these migrations from your application

3. **Foreign key errors**:
   - Run migrations in the exact order specified
   - Don't skip any migration files

4. **RLS policy errors**:
   - Make sure the initial schema migration completed successfully
   - All tables must exist before creating policies

## Next Steps

After successful database setup:
1. Update your `.env.local` file with Supabase credentials
2. Test the API endpoints
3. Verify authentication works
4. Test AI embedding generation

## Support

If you encounter issues:
1. Check the Supabase dashboard logs
2. Verify all environment variables are set correctly
3. Ensure you're using the US East (N. Virginia) region
4. Check that your database password is correct
