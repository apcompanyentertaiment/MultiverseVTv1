import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import BackgroundParticles from './BackgroundParticles'

const Auth: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [message, setMessage] = useState<string | null>(null)

  // Helper: wrap a promise with a timeout to avoid being stuck on network issues
  const withTimeout = <T,>(promise: Promise<T>, ms = 15000) => {
    return new Promise<T>((resolve, reject) => {
      const id = setTimeout(() => reject(new Error('timeout')), ms)
      promise.then(
        (v) => { clearTimeout(id); resolve(v) },
        (e) => { clearTimeout(id); reject(e) }
      )
    })
  }

  // Safety: if loading stays true too long, surface a visible message
  useEffect(() => {
    if (!loading) return
    const id = setTimeout(() => {
      setLoading(false)
      setMessage('Tiempo de espera al contactar con el servidor. Revisa tu conexión e inténtalo de nuevo.')
      console.error('[Auth] Timeout esperando respuesta de Supabase')
    }, 15000)
    return () => clearTimeout(id)
  }, [loading])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[Auth] submit', { mode, hasSupabase: Boolean(supabase) })
    if (!supabase) {
      setMessage('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para habilitar la autenticación.')
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      if (mode === 'signin') {
        const res = await withTimeout(supabase.auth.signInWithPassword({ email, password }))
        const { error } = res as { error: any }
        if (error) throw error
        setMessage('Inicio de sesión exitoso.')
      } else {
        if (!username || username.trim().length < 3) {
          throw new Error('El nombre de usuario debe tener al menos 3 caracteres.')
        }
        const res = await withTimeout(supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim() } }
        }))
        const { data, error } = res as { data: any, error: any }
        if (error) throw error
        
        // If user is immediately confirmed (no email verification required)
        if ((data as any)?.user && (data as any)?.session) {
          try {
            // Call the function to create user profile
            const { error: profileError } = await supabase.rpc('create_user_profile', {
              user_id: (data as any).user.id,
              username: username.trim(),
              user_email: email
            })
            if (profileError) {
              console.warn('Error creating profile:', profileError.message)
              // Don't throw here, as the user registration was successful
            }
          } catch (profileErr) {
            console.warn('Error creating profile:', profileErr)
            // Don't throw here, as the user registration was successful
          }
        }
        
        setMessage('Registro exitoso. Revisa tu correo si se requiere verificación.')
      }
    } catch (err: any) {
      console.error('[Auth] Error en autenticación:', err)
      const details = err?.error_description || err?.message || 'Ocurrió un error'
      setMessage(details)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <BackgroundParticles />
      <div className="auth-card">
        <h2 className="auth-title">{mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
        {!supabase && (
          <div className="auth-warning">
            Modo demo: falta configuración de Supabase. El formulario no enviará.
          </div>
        )}
        <p className="auth-subtitle">Conéctate para guardar tu progreso en el Mapa Cósmico.</p>
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              minLength={3}
              className="auth-input"
            />
          )}
          <input
            type="email"
            placeholder="Tu correo"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          <button type="submit" className="auth-btn" disabled={loading} aria-live="polite">
            {loading ? 'Procesando…' : (mode === 'signin' ? 'Iniciar sesión' : 'Registrarme')}
          </button>
        </form>
        {message && <div className="auth-message">{message}</div>}
        <div className="auth-switch">
          {mode === 'signin' ? (
            <>¿No tienes cuenta?{' '}
              <button type="button" onClick={() => setMode('signup')} className="auth-link">Regístrate</button>
            </>
          ) : (
            <>¿Ya tienes cuenta?{' '}
              <button type="button" onClick={() => setMode('signin')} className="auth-link">Inicia sesión</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Auth