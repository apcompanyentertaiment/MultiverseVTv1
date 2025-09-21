-- Migration: Add column `ubicacion` to table `universos`
-- Purpose: store the map point where the universe was created. JSONB format: {"x": <float>, "y": <float>}

BEGIN;

ALTER TABLE IF EXISTS public.universos
  ADD COLUMN IF NOT EXISTS ubicacion jsonb;

COMMENT ON COLUMN public.universos.ubicacion IS 'Coordenadas del punto seleccionado en el mapa, formato JSON: {"x": float, "y": float}';

COMMIT;