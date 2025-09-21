import React from 'react';
import './Home.css';
import BackgroundParticles from './BackgroundParticles';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <BackgroundParticles />
      <div className="home-content">
        <div className="banner">
          <h1>El Mapa del Corredor Cósmico</h1>
        </div>
        <p style={{ opacity: '0' }}>.</p>
        <p className="tagline">"Listo para iniciar tu viaje? si la respuesta es no, entonces no te preocupes todo esta Bien, Nunca nadie lo esta, pero es hora de comenzar"</p>
        {/* Botón CTA debajo de la primera frase */}
        
        <div style={{ marginTop: 12, marginBottom: 24 }}>
          <Link to="/auth" style={{ textDecoration: 'none' }}>
            <button aria-label="Ir a autenticación (registrarse o iniciar sesión)">
              Iniciar
            </button>
          </Link>
        </div>
        <p style={{ opacity: '0' }}>.</p>
        <p style={{ opacity: '0' }}>.</p>

        <section className="section-card" style={{ ['--bg-url' as any]: "url('https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1600&auto=format&fit=crop')" }}>
          <div className="section-card-text">
            <h2>¿Que es el "Corredor Cosmico"?</h2>
            <p>
              Corredor Cósmico es una serie animada antológica que te invita a explorar el alma de Vtubers de la comunidad hispana. Cada episodio es una ventana a un universo diferente, explorando la fantasía, la ciencia ficción y la psicología detrás del personaje que han creado.

A través de relatos que navegan entre la comedia y el drama, intentamos hacer sentir la empatía por sus vidas, conociendo sus luchas y victorias. Cada decisión que tomen tendrá un peso significativo, y cada pérdida te dejará una pregunta: ¿cuánto de nuestra moral quemaremos hoy por sobrevivir un día más?
            </p>
          </div>
          <div 
            className="section-card-image" 
            style={{ backgroundImage: "url('./logov3 transparent.png')" }}
          />
        </section>

        <section className="section-card reverse" style={{ ['--bg-url' as any]: "url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1600&auto=format&fit=crop')" }}>
          <div className="section-card-text">
            <h2>La Serie "Corredor Cósmico"</h2>
            <p>
              La serie no tiene una temática definida, cada capítulo se ubica en un universo diferente,
              permitiendo jugar con varios estilos narrativos. Su esencia es "Explorar el alma de aquellos seres
              que por lo general tomamos como perfectos pero al final del día siguen siendo humanos".
              Buscamos que los espectadores sientan empatía por los personajes, conociendo sus vidas y el peso
              de cada decisión, victoria o pérdida. Es un tributo a las Vtubers de habla hispana,
              empezando con talentos menos conocidos para luego integrar a figuras más reconocidas,
              permitiendo una experimentación narrativa más profunda.
            </p>
          </div>
          <div 
            className="section-card-image" 
            style={{ backgroundImage: "url('https://via.placeholder.com/300x200/000000/FFFFFF?text=Universo+2')" }}
          />
        </section>

        <section className="section-card" style={{ ['--bg-url' as any]: "url('https://images.unsplash.com/photo-1447433819943-74a20887a81e?q=80&w=1600&auto=format&fit=crop')" }}>
          <div className="section-card-text">
            <h2>La Experiencia Web y el Mapa Cósmico</h2>
            <p>
              Cada episodio de la serie se desarrolla en un universo distinto. Si te quedas con ganas de saber más
              sobre un mundo específico, deberás desbloquear su universo en el "Mapa Cósmico".
              Cada punto blanco en el mapa representa un universo, una historia.
              Para desbloquear información sobre los personajes, sucesos históricos, y quiénes están vivos o muertos,
              deberás resolver acertijos. Cada universo desbloqueado te dará una pista para el siguiente,
              permitiéndote explorar y descubrir todas las historias. Al seguir distintas rutas,
              desbloquearás insignias coleccionables que podrás compartir con la comunidad.
            </p>
            <h3>Mecánica de los Puzzles:</h3>
            <p>
              Más que acertijos, son rompecabezas únicos relacionados con la historia de cada universo.
              Por ejemplo, para desbloquear el universo M28-492 (donde la humanidad colonizó Marte en la era del imperio español),
              recibirás fragmentos de un mapa antiguo con símbolos coloniales y marcianos.
              Instrucciones codificadas en castellano antiguo te guiarán:
              "El sol rojo guía siempre al oeste."
              "Donde el canal se bifurca, allí empieza la ruta."
              "La cruz debe mirar hacia la tierra que nunca duerme."
              Al ensamblar el mapa correctamente, se revelará una marca escondida que desbloqueará la historia completa.
              Los puzzles aumentarán su nivel de dificultad a medida que te acerques a los confines del mapa cósmico.
              Un personaje llamado AP será tu guía en esta aventura, explicando el funcionamiento del "corredor cósmico".
            </p>
          </div>
          <div 
            className="section-card-image" 
            style={{ backgroundImage: "url('https://via.placeholder.com/300x200/000000/FFFFFF?text=Universo+3')" }}
          />
        </section>

        <section className="section-card reverse" style={{ ['--bg-url' as any]: "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600&auto=format&fit=crop')" }}>
          <div className="section-card-text">
            <h2>Sección de la Comunidad y "El Juego"</h2>
            <p>
              La sección de la comunidad funcionará como una red social donde podrás publicar tus logros y textos sencillos.
              Las insignias que colecciones estarán tematizadas con grupos de universos, simbolizando las rutas que tomaste.
              "El Juego" será un mundo abierto 2D de pixel art con combate por turnos.
              Las insignias servirán como potenciadores, y podrás explorar el mapa para encontrar nuevas insignias
              que te darán pistas para universos inaccesibles de otra manera.
            </p>
          </div>
          <div 
            className="section-card-image" 
            style={{ backgroundImage: "url('https://via.placeholder.com/300x200/000000/FFFFFF?text=Universo+4')" }}
          />
        </section>
      </div>
    </div>
  );
};

export default Home;