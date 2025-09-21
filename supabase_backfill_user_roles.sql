-- Backfill de user_roles para usuarios ya registrados en auth.users
-- Ejecuta este script en el SQL Editor de Supabase

begin;

insert into public.user_roles (user_id, username, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'username', u.email) as username,
  'user' as role
from auth.users u
left join public.user_roles r
  on r.user_id = u.id
where r.user_id is null;

commit;