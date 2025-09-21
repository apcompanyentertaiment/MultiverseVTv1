-- Migration: Auto-create profile when user registers
-- Purpose: Create a function to handle profile creation that can be called from the client

-- Function to create profile for a user (to be called from client after signup)
create or replace function public.create_user_profile(
  user_id uuid,
  username text default null,
  user_email text default null
)
returns void as $$
begin
  -- Only allow users to create their own profile
  if auth.uid() != user_id then
    raise exception 'Not authorized to create profile for this user';
  end if;
  
  -- Check if profile already exists
  if exists (select 1 from public.perfil where perfil.user_id = create_user_profile.user_id) then
    return; -- Profile already exists, do nothing
  end if;
  
  -- Insert new profile
  insert into public.perfil (user_id, username, descripcion)
  values (
    create_user_profile.user_id,
    coalesce(create_user_profile.username, create_user_profile.user_email, 'Usuario'), -- Use provided username, email, or default
    'Nuevo usuario en el multiverso' -- Default description
  );
end;
$$ language plpgsql security definer;

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on public.perfil to authenticated;
grant execute on function public.create_user_profile(uuid, text, text) to authenticated;

-- Comments for documentation
comment on function public.create_user_profile(uuid, text, text) is 'Creates a profile for a user - to be called from client after signup';