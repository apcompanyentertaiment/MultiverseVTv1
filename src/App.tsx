import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './Home'
import NavBar from './NavBar'
import './App.css'
import MapaCosmico from './MapaCosmico/MapaCosmico'
import Auth from './Auth'

const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ color: 'white', padding: '6rem 2rem' }}>
    <h1 style={{ marginBottom: '1rem' }}>{title}</h1>
    <p>Contenido en construcción…</p>
  </div>
)

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/mapa-cosmico" element={<MapaCosmico />} />
        <Route path="/noticias" element={<Placeholder title="Noticias" />} />
        <Route path="/juego" element={<Placeholder title="Juego" />} />
        <Route path="/insignias" element={<Placeholder title="Insignias" />} />
        <Route path="/comunidad" element={<Placeholder title="Comunidad" />} />
        <Route path="/ajustes" element={<Placeholder title="Ajustes" />} />
      </Routes>
    </>
  )
}

export default App

