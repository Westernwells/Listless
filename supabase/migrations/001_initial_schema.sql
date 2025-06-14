-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector" with schema "extensions";

-- Create custom types
create type priority_level as enum ('low', 'medium', 'high');
create type theme_type as enum ('light', 'dark', 'system');
create type time_format_type as enum ('12-hour', '24-hour');

-- Users table (extends auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  avatar_url text,
  bio text,
  stripe_customer_id text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User settings table
create table public.user_settings (
  user_id uuid references public.users(id) on delete cascade primary key,
  theme theme_type default 'system'::theme_type not null,
  language text default 'en' not null,
  timezone text default 'UTC' not null,
  date_format text default 'MM/DD/YYYY' not null,
  time_format time_format_type default '12-hour'::time_format_type not null,
  ai_auto_tagging_enabled boolean default true not null,
  ai_smart_grouping_enabled boolean default false not null,
  trash_auto_delete_days integer default 30 not null check (trash_auto_delete_days > 0),
  show_completed_tasks_default boolean default false not null,
  tooltips_enabled boolean default true not null,
  notifications_email_enabled boolean default true not null,
  notifications_in_app_enabled boolean default true not null,
  notifications_push_enabled boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Subscriptions table
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  stripe_subscription_id text unique,
  status text not null,
  plan_name text not null,
  plan_price decimal(10,2),
  billing_cycle text, -- 'monthly', 'yearly'
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Billing details table
create table public.billing_details (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  stripe_customer_id text,
  payment_method_id text,
  last_four text,
  brand text,
  exp_month integer,
  exp_year integer,
  billing_address jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Connected accounts table
create table public.connected_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  provider text not null, -- 'google', 'outlook', 'apple', etc.
  provider_account_id text not null,
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone,
  scope text,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, provider, provider_account_id)
);

-- Areas table
create table public.areas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null check (char_length(name) > 0),
  description text,
  color text default '#6366f1',
  sort_order integer default 0 not null,
  is_archived boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Project lists table
create table public.project_lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  area_id uuid references public.areas(id) on delete set null,
  name text not null check (char_length(name) > 0),
  description text,
  color text default '#6366f1',
  sort_order integer default 0 not null,
  is_archived boolean default false not null,
  is_template boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks table with vector embedding support
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  project_list_id uuid references public.project_lists(id) on delete set null,
  title text not null check (char_length(title) > 0),
  description text,
  completed boolean default false not null,
  priority priority_level default 'medium'::priority_level not null,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  sort_order integer default 0 not null,
  is_deleted boolean default false not null,
  deleted_at timestamp with time zone,
  -- Vector embedding for AI auto-tagging (OpenAI text-embedding-3-small compatibility)
  embedding vector(1536),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tags table
create table public.tags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null check (char_length(name) > 0),
  color text default '#6366f1',
  is_system boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name)
);

-- Task tags junction table with AI support
create table public.task_tags (
  task_id uuid references public.tasks(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  is_ai_suggested boolean default false not null,
  batch_id uuid, -- For grouping AI operations
  confidence_score decimal(3,2), -- AI confidence score (0.00-1.00)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (task_id, tag_id)
);

-- Action history table for undo/redo functionality
create table public.action_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  action_type text not null, -- 'create', 'update', 'delete', 'restore'
  table_name text not null,
  record_id uuid not null,
  old_data jsonb,
  new_data jsonb,
  batch_id uuid, -- For grouping AI-driven changes
  is_ai_action boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for performance optimization
create index idx_users_stripe_customer_id on public.users(stripe_customer_id);
create index idx_user_settings_user_id on public.user_settings(user_id);
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_stripe_id on public.subscriptions(stripe_subscription_id);
create index idx_billing_details_user_id on public.billing_details(user_id);
create index idx_connected_accounts_user_id on public.connected_accounts(user_id);
create index idx_connected_accounts_provider on public.connected_accounts(user_id, provider);
create index idx_areas_user_id on public.areas(user_id);
create index idx_areas_sort_order on public.areas(user_id, sort_order);
create index idx_project_lists_user_id on public.project_lists(user_id);
create index idx_project_lists_area_id on public.project_lists(area_id);
create index idx_project_lists_sort_order on public.project_lists(user_id, sort_order);
create index idx_tasks_user_id on public.tasks(user_id);
create index idx_tasks_project_list_id on public.tasks(project_list_id);
create index idx_tasks_completed on public.tasks(user_id, completed);
create index idx_tasks_due_date on public.tasks(user_id, due_date) where due_date is not null;
create index idx_tasks_priority on public.tasks(user_id, priority);
create index idx_tasks_sort_order on public.tasks(project_list_id, sort_order);
create index idx_tasks_deleted on public.tasks(user_id, is_deleted);
create index idx_tags_user_id on public.tags(user_id);
create index idx_tags_name on public.tags(user_id, name);
create index idx_task_tags_task_id on public.task_tags(task_id);
create index idx_task_tags_tag_id on public.task_tags(tag_id);
create index idx_task_tags_ai_suggested on public.task_tags(is_ai_suggested);
create index idx_task_tags_batch_id on public.task_tags(batch_id) where batch_id is not null;
create index idx_action_history_user_id on public.action_history(user_id);
create index idx_action_history_table_record on public.action_history(table_name, record_id);
create index idx_action_history_batch_id on public.action_history(batch_id) where batch_id is not null;
create index idx_action_history_created_at on public.action_history(user_id, created_at desc);

-- Vector similarity indexes for AI operations
-- HNSW index for fast approximate nearest neighbor search
create index idx_tasks_embedding_hnsw on public.tasks 
using hnsw (embedding vector_cosine_ops) 
with (m = 16, ef_construction = 64);

-- IVFFlat index as alternative for different query patterns
create index idx_tasks_embedding_ivfflat on public.tasks 
using ivfflat (embedding vector_cosine_ops) 
with (lists = 100);
