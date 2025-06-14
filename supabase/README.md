# Supabase Database Setup

This directory contains the complete database schema and setup for the AI-powered task management application.

## Overview

The database is designed to support:
- User authentication and profiles
- Hierarchical task organization (Areas → Projects → Tasks)
- AI-powered auto-tagging with vector embeddings
- Comprehensive audit trail with undo/redo functionality
- Row Level Security (RLS) for data protection
- Performance optimization with appropriate indexes

## Database Schema

### Core Tables

1. **users** - User profiles (extends auth.users)
2. **user_settings** - User preferences and configuration
3. **areas** - Top-level organizational areas
4. **project_lists** - Projects within areas
5. **tasks** - Individual tasks with AI embedding support
6. **tags** - User-defined tags
7. **task_tags** - Many-to-many relationship with AI support
8. **action_history** - Audit trail for undo/redo functionality

### Supporting Tables

- **subscriptions** - Billing and subscription management
- **billing_details** - Payment information
- **connected_accounts** - Third-party integrations

## AI Features

### Vector Embeddings
- Tasks include a `vector(1536)` column for OpenAI text-embedding-3-small compatibility
- HNSW and IVFFlat indexes for fast similarity search
- Functions for semantic task search and tag suggestions

### Auto-tagging Support
- `task_tags.is_ai_suggested` flag for AI-generated tags
- `confidence_score` for AI suggestion quality
- `batch_id` for grouping AI operations

## Migration Files

### 001_initial_schema.sql
- Creates all tables with proper constraints
- Sets up indexes for performance
- Enables pgvector extension

### 002_rls_policies.sql
- Enables Row Level Security on all tables
- Creates comprehensive security policies
- Sets up helper functions for security

### 003_functions.sql
- Vector similarity search functions
- AI tag suggestion functions
- Action history management
- Database utilities

### 004_triggers.sql
- Automatic timestamp updates
- Task state management
- Action history recording
- Data validation

### seed.sql
- Default data setup
- New user initialization
- Example data for development

## Setup Instructions

### 1. Create Supabase Project
```bash
# Visit https://supabase.com and create a new project
# Note down your project URL and API keys
```

### 2. Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env.local

# Add your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Install Supabase CLI (Optional)
```bash
npm install -g supabase
supabase login
```

### 4. Run Migrations
You can run the migrations in several ways:

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file in order
4. Execute them one by one

#### Option B: Using Supabase CLI
```bash
# Initialize local Supabase (optional)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

#### Option C: Manual Execution
Execute the SQL files in this order:
1. `001_initial_schema.sql`
2. `002_rls_policies.sql`
3. `003_functions.sql`
4. `004_triggers.sql`
5. `seed.sql`

### 5. Generate TypeScript Types
```bash
# Using Supabase CLI
supabase gen types typescript --project-id your-project-id > lib/supabase/types.ts

# Or using npx
npx supabase gen types typescript --project-id your-project-id > lib/supabase/types.ts
```

## Database Functions

### Vector Search Functions
- `match_tasks()` - Find similar tasks using embeddings
- `suggest_tags_for_task()` - AI-powered tag suggestions
- `update_task_embedding()` - Update task embeddings
- `batch_update_embeddings()` - Bulk embedding updates

### Utility Functions
- `record_action()` - Record actions for undo/redo
- `get_action_history()` - Retrieve action history
- `get_task_statistics()` - User task analytics
- `cleanup_old_action_history()` - Maintenance function

### User Management
- `setup_new_user_defaults()` - Initialize new user data
- Automatic user settings creation on signup

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- AI operations respect user boundaries
- Batch operations are validated

### Data Validation
- Input sanitization triggers
- Constraint checks
- Foreign key relationships
- Soft delete support

## Performance Optimization

### Indexes
- B-tree indexes for common queries
- Vector similarity indexes (HNSW, IVFFlat)
- Composite indexes for complex queries
- Partial indexes for filtered queries

### Query Optimization
- Efficient RLS policies
- Proper use of foreign keys
- Optimized function implementations

## Maintenance

### Automatic Cleanup
- Orphaned record cleanup
- Old action history removal
- Soft-deleted task cleanup
- Configurable retention periods

### Monitoring
- Database statistics functions
- Performance monitoring views
- Error logging and handling

## Development Notes

### Testing
- Use the seed data for development
- Test RLS policies thoroughly
- Validate AI operations
- Check performance with large datasets

### Backup Strategy
- Regular database backups
- Point-in-time recovery
- Migration rollback procedures
- Data export capabilities

## Troubleshooting

### Common Issues
1. **RLS Policy Errors**: Check user authentication and policy conditions
2. **Vector Search Issues**: Ensure pgvector extension is enabled
3. **Performance Problems**: Check index usage and query plans
4. **Migration Errors**: Run migrations in correct order

### Debug Queries
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'tasks';

-- Check vector extension
SELECT * FROM pg_extension WHERE extname = 'vector';
```

## API Integration

The database is designed to work seamlessly with:
- Supabase client libraries
- Real-time subscriptions
- Edge functions
- Third-party AI services (OpenAI, etc.)

For more information, see the application documentation and API reference.
