-- Supabase setup: universos + user_roles, and trigger to auto-insert user_roles on registration
-- Run this file in Supabase SQL Editor (Project > SQL > New query)

-- 1) Tabla public.universos (3 columnas solicitadas)
create table if not exists public.universos (
  titulo text,
  banner_preview text,
  info_preview text
);

-- 2) Tabla public.user_roles (user id, username, role por defecto 'user')
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text,
  role text default 'user'
);

-- 3) Función + Trigger para insertar automáticamente en user_roles al crear un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Toma el username desde la metadata proporcionada en el registro (Auth.tsx -> signUp options.data.username)
  insert into public.user_roles (user_id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', new.email))
  on conflict (user_id) do update set username = excluded.username;

  return new;
end;
$$;

-- recrea el trigger de forma segura
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();