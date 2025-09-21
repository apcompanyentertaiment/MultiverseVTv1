import React, { useMemo, useEffect, useRef, useState } from 'react';
import './MapaCosmico.css';
import BackgroundParticles from '../BackgroundParticles';
import Universo from './Universos/universo';
import MapaAdminPanel from './MapaAdminPanel'
import { supabase } from '../supabaseClient'
import UniversoForm from './Universos/formulario_de_creacion_de_universo'

// PRNG determinista para tener órbitas estables entre renders/dev
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MapaCosmico: React.FC = () => {
  // Mundo 100x más grande
  const baseSize = 800;
  const size = baseSize * 100; // 100x
  const cx = size / 2;
  const cy = size / 2;

  // Estado de cámara (viewBox)
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState({
    x: cx - baseSize / 2,
    y: cy - baseSize / 2,
    w: baseSize,
    h: baseSize,
  });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<null | { cx: number; cy: number; view: { x: number; y: number; w: number; h: number } }>(null);
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  // Hover del nodo para mostrar panel "Universo"
  type HoverInfo = { x: number; y: number; orbitIndex: number; angleIndex: number; leftPct: number; topPct: number } | null;
  const [hover, setHover] = useState<HoverInfo>(null);
  
  // Admin controls (FAB + Panel)
  const [isAdmin, setIsAdmin] = useState(false); // se resuelve desde Supabase
  const [panelOpen, setPanelOpen] = useState(false);
  
  // Modo de creación de universo (selección de punto)
  const [creationMode, setCreationMode] = useState(false)
  const creationTimer = useRef<number | null>(null)
  const [creationPoint, setCreationPoint] = useState<{x:number,y:number} | null>(null)

  const startCreationMode = () => {
    setPanelOpen(false)
    setCreationMode(true)
    if (creationTimer.current) window.clearTimeout(creationTimer.current)
    creationTimer.current = window.setTimeout(() => {
      setCreationMode(false)
      creationTimer.current = null
    }, 60000)
  }

  const cancelCreationMode = () => {
    setCreationMode(false)
    if (creationTimer.current) { window.clearTimeout(creationTimer.current); creationTimer.current = null }
  }

  const handleMapClickForCreation = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!creationMode || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const wx = view.x + (mx / rect.width) * view.w
    const wy = view.y + (my / rect.height) * view.h

    // Intentar anclar al nodo más cercano en espacio de pantalla (umbral 18px)
    let snapped: { x: number; y: number } | null = null
    let minD = Infinity
    for (const n of nodes) {
      const sx = ((n.x - view.x) / view.w) * rect.width
      const sy = ((n.y - view.y) / view.h) * rect.height
      const d = Math.hypot(sx - mx, sy - my)
      if (d < minD) { minD = d; snapped = { x: n.x, y: n.y } }
    }
    const thresholdPx = 18
    const chosen = minD <= thresholdPx && snapped ? snapped : { x: wx, y: wy }

    setCreationPoint(chosen)
    setCreationMode(false)
    if (creationTimer.current) { window.clearTimeout(creationTimer.current); creationTimer.current = null }
  }

  // Resolver rol del usuario actual en Supabase y escuchar cambios de sesión
  useEffect(() => {
    if (!supabase) return; // modo demo sin supabase
    let mounted = true;

    const resolveRole = async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes?.user;
        if (!mounted) return;
        if (!user) {
          setIsAdmin(false);
          return;
        }
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!mounted) return;
        if (error) {
          console.warn('user_roles fetch error', error.message);
          setIsAdmin(false);
          return;
        }
        const role = (data?.role || '').toString().toLowerCase();
        setIsAdmin(role === 'admin');
      } catch (e) {
        console.warn('resolveRole error', (e as Error).message);
        setIsAdmin(false);
      }
    };

    resolveRole();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      resolveRole();
    });

    return () => {
      mounted = false;
      try { listener?.subscription?.unsubscribe(); } catch {}
    };
  }, []);

  const updateHoverPosition = (wx: number, wy: number, orbitIndex: number, angleIndex: number) => {
    // Convertir coordenadas del mundo (SVG) a porcentaje relativo al viewBox actual
    const leftPct = ((wx - view.x) / view.w) * 100;
    const topPct = ((wy - view.y) / view.h) * 100;
    setHover({ x: wx, y: wy, orbitIndex, angleIndex, leftPct, topPct });
  };

  useEffect(() => {
    // Recalcular posición del panel al cambiar el viewBox
    if (hover) {
      updateHoverPosition(hover.x, hover.y, hover.orbitIndex, hover.angleIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // coordenadas del mouse en el mundo
    const wx = view.x + (mx / rect.width) * view.w;
    const wy = view.y + (my / rect.height) * view.h;
    // factor de zoom suave
    const factor = Math.pow(1.001, e.deltaY);
    const minW = 120; // zoom máximo in
    const maxW = size; // zoom out hasta ver todo el mundo
    let newW = clamp(view.w * factor, minW, maxW);
    let newH = newW;
    // Re-centrar para que el punto bajo el cursor permanezca estable
    let newX = wx - (mx / rect.width) * newW;
    let newY = wy - (my / rect.height) * newH;
    newX = clamp(newX, 0, size - newW);
    newY = clamp(newY, 0, size - newH);
    setView({ x: newX, y: newY, w: newW, h: newH });
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    panStart.current = { cx: e.clientX, cy: e.clientY, view };
    setIsPanning(true);
  };
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPanning || !panStart.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dxPx = e.clientX - panStart.current.cx;
    const dyPx = e.clientY - panStart.current.cy;
    const scaleX = panStart.current.view.w / rect.width;
    const scaleY = panStart.current.view.h / rect.height;
    let newX = panStart.current.view.x - dxPx * scaleX;
    let newY = panStart.current.view.y - dyPx * scaleY;
    newX = clamp(newX, 0, size - view.w);
    newY = clamp(newY, 0, size - view.h);
    setView((v) => ({ ...v, x: newX, y: newY }));
  };
  const endPan = () => {
    setIsPanning(false);
    panStart.current = null;
  };

  // Soporte de teclado WASD
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!['w', 'a', 's', 'd'].includes(k)) return;
      const base = 0.032 * view.w; // 60% más lento que 0.08 (40% del original)
      const step = e.shiftKey ? base * 1.2 : base; // Shift = +20%
      let { x, y, w, h } = view;
      if (k === 'w') y -= step;
      if (k === 's') y += step;
      if (k === 'a') x -= step;
      if (k === 'd') x += step;
      x = clamp(x, 0, size - w);
      y = clamp(y, 0, size - h);
      setView({ x, y, w, h });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, size]);

  const centralRadius = 40; // círculo central alrededor del punto
  const orbitCount = 35; // "unos 35" (antes 20)
  const lineCount = 8; // "unas 8"
  const maxOrbit = size * 0.45; // margen para no tocar bordes
  const minOrbit = centralRadius + 20;
  const linkCount = 30; // líneas aleatorias desde el centro a puntos en órbitas (antes 15)

  type Orbit = { a: number; b: number; thetaRad: number; thetaDeg: number };
  type Node = { x: number; y: number; key: string; orbitIndex: number; angleIndex: number };

  // Generar elipses con tamaños y orientaciones aleatorias pero deterministas
  const orbits = useMemo<Orbit[]>(() => {
    const rand = mulberry32(0xC0FFEE); // semilla fija válida
    const list: Orbit[] = [];
    for (let i = 0; i < orbitCount; i++) {
      const base = minOrbit + (i / (orbitCount - 1)) * (maxOrbit - minOrbit);
      const a = base * (0.95 + 0.1 * rand()); // ligera variación
      const ratio = 0.55 + 0.4 * rand(); // 0.55..0.95 para alargarlas
      const b = a * ratio;
      const thetaDeg = Math.floor(rand() * 180); // orientación aleatoria 0..180
      const thetaRad = (thetaDeg * Math.PI) / 180;
      list.push({ a, b, thetaRad, thetaDeg });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const angles = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => (i * (Math.PI * 2)) / lineCount),
    [lineCount]
  );

  // Calcular intersecciones de cada rayo con cada elipse
  // Para una elipse (a,b) rotada theta, el radio en la dirección alpha es:
  // r(alpha) = 1 / sqrt( cos^2(alpha-theta)/a^2 + sin^2(alpha-theta)/b^2 )
  const nodes = useMemo<Node[]>(() => {
    const pts: Node[] = [];

    // 1) Intersecciones rayo–órbita (existente)
    orbits.forEach((orb, ri) => {
      angles.forEach((alpha, ai) => {
        const rel = alpha - orb.thetaRad;
        const cos = Math.cos(rel);
        const sin = Math.sin(rel);
        const denom = (cos * cos) / (orb.a * orb.a) + (sin * sin) / (orb.b * orb.b);
        const r = 1 / Math.sqrt(denom);
        const x = cx + r * Math.cos(alpha);
        const y = cy + r * Math.sin(alpha);
        pts.push({ x, y, key: `r${ri}-a${ai}`, orbitIndex: ri, angleIndex: ai });
      });
    });

    // Utilidades para órbita–órbita
    const near = (x1: number, y1: number, x2: number, y2: number) => {
      const dx = x1 - x2; const dy = y1 - y2; return Math.sqrt(dx*dx + dy*dy);
    };
    const existsNear = (x: number, y: number, thr: number) => pts.some(p => near(p.x, p.y, x, y) < thr);

    const pointOnEllipse = (e: Orbit, t: number) => {
      const cosT = Math.cos(t), sinT = Math.sin(t);
      const cosTh = Math.cos(e.thetaRad), sinTh = Math.sin(e.thetaRad);
      const x = cx + e.a * cosT * cosTh - e.b * sinT * sinTh;
      const y = cy + e.a * cosT * sinTh + e.b * sinT * cosTh;
      return { x, y };
    };
    const implicitValue = (e: Orbit, x: number, y: number) => {
      // Llevar el punto al sistema de e
      const dx = x - cx, dy = y - cy;
      const cosTh = Math.cos(e.thetaRad), sinTh = Math.sin(e.thetaRad);
      const xr = dx * cosTh + dy * sinTh;
      const yr = -dx * sinTh + dy * cosTh;
      return (xr * xr) / (e.a * e.a) + (yr * yr) / (e.b * e.b) - 1; // 0 cuando está en la elipse
    };
    const nearestAngleIndex = (x: number, y: number) => {
      const a = Math.atan2(y - cy, x - cx);
      let bestI = 0, bestD = Infinity;
      for (let i = 0; i < angles.length; i++) {
        const d = Math.abs(Math.atan2(Math.sin(a - angles[i]), Math.cos(a - angles[i])));
        if (d < bestD) { bestD = d; bestI = i; }
      }
      return bestI;
    };
    const refineBisection = (e1: Orbit, e2: Orbit, t0: number, t1: number, f0: number, f1: number) => {
      let a = t0, b = t1, fa = f0, fb = f1;
      for (let i = 0; i < 30; i++) {
        const m = 0.5 * (a + b);
        const { x, y } = pointOnEllipse(e1, m);
        const fm = implicitValue(e2, x, y);
        if (Math.abs(fm) < 1e-6) return m;
        if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
      }
      return 0.5 * (a + b);
    };

    // 2) Intersecciones órbita–órbita (nuevo robusto)
    const samples = 360; // denso para no perder raíces
    const nearZero = 2e-3; // criterio de casi-cero de la implícita
    const dedupThr = 6; // px en coordenadas del mundo

    const addIfNotDuplicate = (x: number, y: number, oi: number) => {
      if (!existsNear(x, y, dedupThr)) {
        const ai = nearestAngleIndex(x, y);
        pts.push({ x, y, key: `oo-${oi}-${pts.length}`, orbitIndex: oi, angleIndex: ai });
      }
    };

    const findEllipseIntersections = (e1: Orbit, oi1: number, e2: Orbit, oi2: number) => {
      let tPrev = 0;
      let { x: xPrev, y: yPrev } = pointOnEllipse(e1, tPrev);
      let fPrev = implicitValue(e2, xPrev, yPrev);

      for (let s = 1; s <= samples; s++) {
        const t = (s / samples) * (Math.PI * 2);
        const { x, y } = pointOnEllipse(e1, t);
        const f = implicitValue(e2, x, y);

        // 2a) Raíz por cambio de signo -> refinar
        if (fPrev === 0 || f === 0 || fPrev * f < 0) {
          const tRoot = refineBisection(e1, e2, tPrev, t, fPrev, f);
          const p = pointOnEllipse(e1, tRoot);
          addIfNotDuplicate(p.x, p.y, oi1);
        } else {
          // 2b) Casi-cero (tangencia) -> aceptar directamente
          if (Math.abs(f) < nearZero) {
            addIfNotDuplicate(x, y, oi1);
          }
        }
        tPrev = t; xPrev = x; yPrev = y; fPrev = f;
      }
    };

    for (let i = 0; i < orbits.length; i++) {
      for (let j = i + 1; j < orbits.length; j++) {
        findEllipseIntersections(orbits[i], i, orbits[j], j);
      }
    }

    return pts;
  }, [orbits, angles, cx, cy]);

  // Puntos aleatorios en órbitas aleatorias y líneas desde el centro
  const randomLinks = useMemo(() => {
    const rand = mulberry32(0xBEEF01);
    const links: { x: number; y: number; orbitIndex: number; t: number; key: string }[] = [];
    for (let i = 0; i < linkCount; i++) {
      const oi = Math.floor(rand() * orbits.length);
      const o = orbits[oi];
      const t = rand() * Math.PI * 2; // parámetro en la elipse
      // Punto en elipse (a cos t, b sin t) rotado por theta y trasladado a (cx, cy)
      const cosT = Math.cos(t);
      const sinT = Math.sin(t);
      const cosTh = Math.cos(o.thetaRad);
      const sinTh = Math.sin(o.thetaRad);
      const x = cx + o.a * cosT * cosTh - o.b * sinT * sinTh;
      const y = cy + o.a * cosT * sinTh + o.b * sinT * cosTh;
      links.push({ x, y, orbitIndex: oi, t, key: `rl-${i}` });
    }
    return links;
  }, [orbits, linkCount, cx, cy]);

  return (
    <div className="mapa-cosmico__container">
      {/* Fondo de partículas reutilizado de Home */}
      <BackgroundParticles />

      <main className="mapa-cosmico__content">
        {/* Cabecera eliminada para foco total en el mapa */}
        
        <section className="mapa-cosmico__map" aria-label="Mapa cósmico interactivo">
          <svg
            ref={svgRef}
            className={`mapa-cosmico__svg ${isPanning ? 'is-panning' : ''} ${creationMode ? 'is-creating' : ''}`}
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            role="img"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={endPan}
            onMouseLeave={endPan}
            onClick={handleMapClickForCreation}
          >
            <title>Mapa cósmico</title>

            {/* Órbitas (elipses) */}
            <g className="orbits">
              {/* círculo central */}
              <circle className="orbit orbit--central" cx={cx} cy={cy} r={centralRadius} />
              {orbits.map((o, i) => (
                <ellipse
                  key={`o-${i}`}
                  className="orbit"
                  cx={cx}
                  cy={cy}
                  rx={o.a}
                  ry={o.b}
                  transform={`rotate(${o.thetaDeg} ${cx} ${cy})`}
                />
              ))}
            </g>

            {/* Líneas radiales */}
            <g className="rays">
              {angles.map((a, i) => {
                const x1 = cx - maxOrbit * Math.cos(a);
                const y1 = cy - maxOrbit * Math.sin(a);
                const x2 = cx + maxOrbit * Math.cos(a);
                const y2 = cy + maxOrbit * Math.sin(a);
                return <line key={`l-${i}`} className="ray" x1={x1} y1={y1} x2={x2} y2={y2} />;
              })}
            </g>

            {/* Líneas desde el centro a puntos aleatorios de órbitas */}
            <g className="random-links">
              {randomLinks.map((p, i) => (
                <g key={p.key}>
                  <line className="random-link" x1={cx} y1={cy} x2={p.x} y2={p.y} />
                  <circle className="random-endpoint" cx={p.x} cy={p.y} r={2.8}>
                    <title>{`Enlace ${i + 1} → órbita ${p.orbitIndex + 1}`}</title>
                  </circle>
                </g>
              ))}
            </g>

            {/* Punto central */}
            <g className="center">
              <circle className="center-point" cx={cx} cy={cy} r={5} />
            </g>

            {/* Nodos en cada intersección */}
            <g className="nodes">
              {nodes.map((p, idx) => (
                <g
                  key={p.key}
                  className="node-wrap"
                  onMouseEnter={() => updateHoverPosition(p.x, p.y, p.orbitIndex, p.angleIndex)}
                  onMouseLeave={() => setHover(null)}
                >
                  {/* Área de impacto 3x más grande para facilitar el descubrimiento */}
                  <circle className="node-hit" cx={p.x} cy={p.y} r={9.6} />

                  {/* Punto visible (mantiene el tamaño original) */}
                  <circle
                    className="node"
                    cx={p.x}
                    cy={p.y}
                    r={3.2}
                    tabIndex={0}
                    onFocus={() => updateHoverPosition(p.x, p.y, p.orbitIndex, p.angleIndex)}
                    onBlur={() => setHover(null)}
                  >
                    <title>{`Nodo ${idx + 1}`}</title>
                  </circle>
                </g>
              ))}
            </g>
          </svg>

          {hover && (
            <Universo
              title="Universo"
              subtitle={`Órbita ${hover.orbitIndex + 1} · Nodo ${hover.angleIndex + 1}`}
              style={{
                position: 'absolute',
                left: `${Math.max(4, Math.min(96, hover.leftPct))}%`,
                top: `${Math.max(4, Math.min(96, hover.topPct))}%`,
                transform: hover.topPct < 20 ? 'translate(-50%, 10%)' : 'translate(-50%, -120%)',
                zIndex: 70,
                pointerEvents: 'none',
              }}
              worldX={hover.x}
              worldY={hover.y}
            />
          )}

          {/* Panel de creación de universo (flotante grande) */}
          <UniversoForm
            open={!!creationPoint}
            onClose={() => setCreationPoint(null)}
            worldX={creationPoint?.x ?? 0}
            worldY={creationPoint?.y ?? 0}
            view={view}
          />
        </section>

        {isAdmin && (
          <>
            <button
              className="admin-fab"
              aria-label="Abrir panel de administración"
              onClick={() => setPanelOpen(true)}
            >
              ✎
            </button>
            <MapaAdminPanel
              open={panelOpen}
              onClose={() => setPanelOpen(false)}
              onAddUniverse={startCreationMode}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default MapaCosmico;