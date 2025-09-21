import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';

interface UniversoProps {
  title?: string;
  subtitle?: string;
  style?: React.CSSProperties;
  // coordenadas del mundo para buscar si existe un universo en esa ubicación
  worldX?: number;
  worldY?: number;
}

type UniversoDB = {
  titulo: string | null;
  banner_preview: string | null;
  info_preview: string | null;
  ubicacion: { x?: number; y?: number } | null;
}

const findNearest = (items: UniversoDB[], x?: number, y?: number) => {
  if (x == null || y == null) return null;
  let best: { item: UniversoDB; d: number } | null = null;
  for (const it of items) {
    const xi = (it.ubicacion as any)?.x; const yi = (it.ubicacion as any)?.y;
    if (typeof xi !== 'number' || typeof yi !== 'number') continue;
    const dx = xi - x; const dy = yi - y; const d = Math.hypot(dx, dy);
    if (!best || d < best.d) best = { item: it, d };
  }
  return best;
}

const Universo: React.FC<UniversoProps> = ({ title = 'Universo', subtitle, style, worldX, worldY }) => {
  const [record, setRecord] = useState<UniversoDB | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (worldX == null || worldY == null) { setRecord(null); return; }
      setLoading(true);
      try {
        // Intento: filtrar por proximidad con un bounding box simple en JSON (igualdad o cercanía por redondeo)
        // Supabase no permite consultas aritméticas directas sobre jsonb sin RPC, así que hacemos fetch simple.
        const { data, error } = await supabase
          .from('universos')
          .select('titulo,banner_preview,info_preview,ubicacion');
        if (error) throw error;
        const list = (data as any as UniversoDB[]) || [];
        // 1) Igualdad exacta primero (con tolerancia pequeña)
        const exact = list.find(it => {
          const xi = (it.ubicacion as any)?.x; const yi = (it.ubicacion as any)?.y;
          return typeof xi === 'number' && typeof yi === 'number' && Math.abs(xi - worldX) <= 1 && Math.abs(yi - worldY) <= 1;
        });
        if (exact) { if (!cancelled) { setRecord(exact); setLoading(false); } return; }
        // 2) Cercanía (umbral 32 unidades)
        const nearest = findNearest(list, worldX, worldY);
        if (nearest && nearest.d < 32) {
          if (!cancelled) setRecord(nearest.item);
        } else {
          if (!cancelled) setRecord(null);
        }
      } catch (e) {
        if (!cancelled) setRecord(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [worldX, worldY]);

  const hasData = !!record && (!!record.titulo || !!record.banner_preview || !!record.info_preview);

  if (hasData) {
    const bg = record!.banner_preview || undefined;
    return (
      <div
        style={{
          position: 'absolute',
          minWidth: 260,
          maxWidth: 360,
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 10,
          padding: '12px 12px 10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.45), 0 0 10px rgba(255,255,255,0.12) inset',
          backdropFilter: 'blur(2px)',
          overflow: 'hidden',
          pointerEvents: 'none',
          ...style,
        }}
      >
        {/* Fondo de banner con opacidad 100% */}
        {bg && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${bg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.5,
              filter: 'saturate(1.05) contrast(1.05)',
            }}
          />
        )}
        {/* Capa de contenido */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              fontWeight: 800,
              letterSpacing: 0.3,
              // Borde negro (outline) para resaltar el texto
              textShadow:
                '2px 0 #000, -2px 0 #000, 0 2px #000, 0 -2px #000, 1.5px 1.5px #000, -1.5px -1.5px #000, 1.5px -1.5px #000, -1.5px 1.5px #000, 0 0 10px rgba(0,0,0,0.65)',
              WebkitTextStroke: '0.8px #000',
            }}
          >
            {record!.titulo || title}
          </div>
          {record!.info_preview && (
            <div
              style={{
                marginTop: 6,
                opacity: 0.98,
                // Borde negro sutil para el cuerpo
                textShadow:
                  '1px 0 #000, -1px 0 #000, 0 1px #000, 0 -1px #000, 0 0 6px rgba(0,0,0,0.6)',
                WebkitTextStroke: '0.5px #000',
              }}
            >
              {record!.info_preview}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback anterior si no hay datos
  return (
    <div style={{
      background: 'rgba(10, 10, 10, 0.85)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.25)',
      borderRadius: 8,
      padding: '10px 12px',
      fontSize: 12,
      lineHeight: 1.25,
      boxShadow: '0 6px 20px rgba(0,0,0,0.45), 0 0 10px rgba(255,255,255,0.12) inset',
      backdropFilter: 'blur(2px)',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      <div style={{ fontWeight: 700, letterSpacing: 0.4 }}>{title}</div>
      {subtitle && <div style={{ opacity: 0.85, marginTop: 2 }}>{subtitle}</div>}
      {loading && <div style={{ opacity: 0.6, marginTop: 4 }}>Buscando universo…</div>}
    </div>
  );
};

export default Universo;