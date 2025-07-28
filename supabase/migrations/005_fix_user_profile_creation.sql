-- Fix user profile creation on signup
-- This migration adds a trigger to automatically create a user profile
-- in public.users when a user signs up via auth.users

-- Function to automatically create user profile when a user signs up
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create user profile in public.users
  insert into public.users (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email)
  );
  
  return new;
end;
$$;

-- Create trigger for automatic user profile creation on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- For existing users who don't have a profile, create one
insert into public.users (id, name, created_at, updated_at)
select 
  au.id,
  coalesce(au.raw_user_meta_data->>'name', au.email) as name,
  au.created_at,
  au.updated_at
from auth.users au
left join public.users pu on au.id = pu.id
where pu.id is null;
