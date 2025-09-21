-- Migration: Create 'perfil' table for user profiles
-- Purpose: Store user profile information including picture, username, and description

-- Create the perfil table
create table if not exists public.perfil (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  picture_perfil text, -- URL to profile picture
  username text not null,
  descripcion text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create indexes for better performance
create index if not exists perfil_user_id_idx on public.perfil(user_id);
create index if not exists perfil_username_idx on public.perfil(username);

-- Enable RLS (Row Level Security)
alter table public.perfil enable row level security;

-- RLS Policies
-- Users can read all profiles (for public display)
create policy "Profiles are viewable by everyone" 
  on public.perfil for select 
  using (true);

-- Users can only update their own profile
create policy "Users can update own profile" 
  on public.perfil for update 
  using (auth.uid() = user_id);

-- Users can only insert their own profile
create policy "Users can insert own profile" 
  on public.perfil for insert 
  with check (auth.uid() = user_id);

-- Function to update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger handle_perfil_updated_at
  before update on public.perfil
  for each row execute procedure public.handle_updated_at();

-- Comments for documentation
comment on table public.perfil is 'User profile information';
comment on column public.perfil.user_id is 'Reference to auth.users.id';
comment on column public.perfil.picture_perfil is 'URL to user profile picture';
comment on column public.perfil.username is 'Display username chosen by user';
comment on column public.perfil.descripcion is 'User bio/description';