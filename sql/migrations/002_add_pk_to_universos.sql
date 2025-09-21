-- Migration: Add primary key column `id` to table `universos`
-- Purpose: Enable safe updates/deletes from Supabase Table Editor and API by providing a unique identifier per row.

-- Ensure pgcrypto is available for gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) Add the UUID column with default generator (fills new inserts)
alter table public.universos
  add column if not exists id uuid default gen_random_uuid();

-- 2) Backfill existing rows that might have NULL in `id`
update public.universos set id = gen_random_uuid() where id is null;

-- 3) Make it NOT NULL
alter table public.universos
  alter column id set not null;

-- 4) Add PRIMARY KEY constraint (will also create an index)
alter table public.universos
  add primary key (id);

-- Notes:
-- - If you prefer incremental integers instead of UUIDs, replace the steps above with:
--     alter table public.universos add column id bigserial;
--     alter table public.universos add primary key (id);
-- - UUIDs are recommended for public APIs as they are hard to guess and easy to generate client-side if needed.