import React, { useEffect, useMemo, useRef, useState } from 'react'
import './formulario_de_creacion_de_universo.css'
import { supabase } from '../../supabaseClient'

// Props: abre como panel flotante grande; worldX/worldY = coordenadas del mundo donde se hizo click
// view = viewBox actual para posicionarlo relativo si queremos una marca, de momento centramos el panel

type Props = {
  open: boolean
  onClose: () => void
  worldX: number
  worldY: number
  view: { x: number; y: number; w: number; h: number }
}

const UniversoForm: React.FC<Props> = ({ open, onClose, worldX, worldY, view }) => {
  const [titulo, setTitulo] = useState('')
  const [banner, setBanner] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Tabs de secciones
  const sections = [
    'Preview',
    'Datos Generales',
    'Imagenes',
    'Personajes',
    'Historias Tangentes',
    'Datos Curiosos',
  ] as const
  type Section = typeof sections[number]
  const [active, setActive] = useState<Section>('Preview')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      // reset basico cuando se cierra
      setSaving(false); setError(null); setSuccess(null)
    }
  }, [open])

  const handleSave = async () => {
    setError(null); setSuccess(null)
    if (!titulo.trim()) { setError('El título es obligatorio'); return }
    setSaving(true)
    try {
      const payload = {
        titulo: titulo.trim(),
        banner_preview: banner.trim() || null,
        info_preview: descripcion.trim() || null,
        ubicacion: { x: worldX, y: worldY } as any,
      }
      const { error: dbError } = await supabase.from('universos').insert(payload)
      if (dbError) throw dbError
      setSuccess('Guardado correctamente')
      onClose()
      // Opcional: limpiar campos
      setTitulo(''); setBanner(''); setDescripcion('')
    } catch (e: any) {
      setError(e?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null
  
  return (
    <div className={`universe-form__overlay ${open ? 'is-open' : ''}`}>
      <div className="universe-form__backdrop" onClick={onClose} />
      <div className="universe-form__sheet" role="dialog" aria-modal="true" aria-label="Crear universo">
        <header className="universe-form__header">
          <h3>Crear universo</h3>
          <button className="universe-form__close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        <nav className="universe-form__tabs" aria-label="Secciones del formulario">
          {sections.map((s) => (
            <button key={s} className={`universe-form__tab ${active === s ? 'is-active' : ''}`} onClick={() => setActive(s)}>
              {s}
            </button>
          ))}
        </nav>

        <div className="universe-form__content">
          {active === 'Preview' && (
            <div className="form-section">
              <div className="form-field">
                <label>Título</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej. El Bosque de Andrómeda" />
              </div>
              <div className="form-field">
                <label>Banner (URL)</label>
                <input value={banner} onChange={e => setBanner(e.target.value)} placeholder="https://..." />
              </div>
              <div className="form-field">
                <label>Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={5} placeholder="Resumen breve del universo" />
              </div>
              <p style={{opacity:.8,fontSize:12}}>
                Punto seleccionado: x={worldX.toFixed(2)}, y={worldY.toFixed(2)}
              </p>
              {error && <p style={{color:'#ff8b8b'}}>{error}</p>}
              {success && <p style={{color:'#7bff9a'}}>{success}</p>}
            </div>
          )}

          {active !== 'Preview' && (
            <div className="form-section form-section--placeholder">
              <p>Próximamente: {active}</p>
            </div>
          )}
        </div>

        <footer className="universe-form__footer">
          <button className="btn btn--ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default UniversoForm