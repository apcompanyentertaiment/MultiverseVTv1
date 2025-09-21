import React from 'react'
import './MapaAdminPanel.css'

type Props = {
  open: boolean
  onClose: () => void
  onAddUniverse?: () => void
}

const MapaAdminPanel: React.FC<Props> = ({ open, onClose, onAddUniverse }) => {
  const handleAdd = () => {
    try { onAddUniverse && onAddUniverse() } finally { onClose() }
  }
  return (
    <div className={`admin-panel__overlay ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="admin-panel__backdrop" onClick={onClose} />
      <aside className="admin-panel__sheet" role="dialog" aria-modal="true" aria-label="Panel de administración">
        <header className="admin-panel__header">
          <h3>Panel de administración</h3>
          <button className="admin-panel__close" onClick={onClose} aria-label="Cerrar panel">×</button>
        </header>
        <div className="admin-panel__content">
          <button className="admin-action" type="button" onClick={handleAdd}>
            <span className="icon">✚</span>
            Añadir Universo
          </button>
        </div>
      </aside>
    </div>
  )
}

export default MapaAdminPanel