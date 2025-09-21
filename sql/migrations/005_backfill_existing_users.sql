-- Migration: Backfill profiles for existing users
-- Purpose: Create profile entries for users who registered before the profile system

-- Insert profiles for existing users who don't have one yet
insert into public.perfil (user_id, username, descripcion)
select 
  u.id,
  coalesce(
    u.raw_user_meta_data->>'username', 
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1) -- Use email prefix as fallback username
  ) as username,
  'Usuario del multiverso' as descripcion
from auth.users u
left join public.perfil p on u.id = p.user_id
where p.user_id is null -- Only insert for users without existing profiles
  and u.email_confirmed_at is not null; -- Only for confirmed users

-- Update the count for verification
do $$
declare
  user_count integer;
  profile_count integer;
begin
  select count(*) into user_count from auth.users where email_confirmed_at is not null;
  select count(*) into profile_count from public.perfil;
  
  raise notice 'Backfill completed. Users: %, Profiles: %', user_count, profile_count;
end $$;