import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';
import logo from '../logov2 transparent.png';
import { supabase } from './supabaseClient';

interface UserProfile {
  username: string;
  picture_perfil?: string;
}

const NavBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Close menu on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Prevent scroll when menu open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Auth state management
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const getProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('perfil')
          .select('username, picture_perfil')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!mounted) return;
        
        if (error) {
          console.warn('Error fetching profile:', error.message);
          setProfile(null);
          return;
        }
        
        // If no profile exists, try to create one
        if (!data) {
          try {
            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;
            
            if (user) {
              const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario';
              
              const { error: createError } = await supabase.rpc('create_user_profile', {
                user_id: user.id,
                username: username,
                user_email: user.email
              });
              
              if (!createError) {
                // Fetch the newly created profile
                const { data: newProfile } = await supabase
                  .from('perfil')
                  .select('username, picture_perfil')
                  .eq('user_id', userId)
                  .maybeSingle();
                
                setProfile(newProfile);
                return;
              }
            }
          } catch (createErr) {
            console.warn('Error auto-creating profile:', createErr);
          }
        }
        
        setProfile(data);
      } catch (e) {
        console.warn('Profile fetch error:', (e as Error).message);
        setProfile(null);
      }
    };

    const checkAuth = async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const currentUser = userRes?.user;
        
        if (!mounted) return;
        
        setUser(currentUser);
        
        if (currentUser) {
          await getProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.warn('Auth check error:', (e as Error).message);
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        await getProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      try { 
        listener?.subscription?.unsubscribe(); 
      } catch {}
    };
  }, []);

  const handleSignOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', (e as Error).message);
    }
  };

  const items = ['Home', 'Noticias', 'Mapa Cosmico', 'Juego', 'Insignias', 'Comunidad', 'Ajustes'] as const;
  const routes: Record<(typeof items)[number], string> = {
    'Home': '/',
    'Noticias': '/noticias',
    'Mapa Cosmico': '/mapa-cosmico',
    'Juego': '/juego',
    'Insignias': '/insignias',
    'Comunidad': '/comunidad',
    'Ajustes': '/ajustes',
  };

  return (
    <>
      <header className="nav-bar" role="banner">
        <button
          className="logo-button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="main-menu"
          title="Abrir menú"
        >
          <img src={logo} alt="Logo Corredor Cósmico" className="logo-img" />
        </button>
        
        {/* Auth section */}
        <div className="nav-auth">
          {loading ? (
            <div className="auth-loading">...</div>
          ) : user ? (
            <div className="profile-section">
              <div className="profile-circle" title={profile?.username || 'Usuario'}>
                {profile?.picture_perfil ? (
                  <img 
                    src={profile.picture_perfil} 
                    alt={profile.username || 'Usuario'} 
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-initials">
                    {(profile?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button className="sign-out-btn" onClick={handleSignOut} title="Cerrar sesión">
                ⏻
              </button>
            </div>
          ) : (
            <Link to="/auth" className="auth-button">
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>

      <div className={`nav-overlay ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="menu-panel" id="main-menu" role="navigation" aria-label="Menú principal">
          <nav>
            <ul className="menu-list">
              {items.map((item) => (
                <li key={item} className="menu-item">
                  <Link to={routes[item]} className="menu-link" onClick={() => setOpen(false)}>
                    <span className="menu-link-deco" aria-hidden></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <button className="overlay-backdrop" onClick={() => setOpen(false)} aria-label="Cerrar menú" />
      </div>
    </>
  );
};

export default NavBar;