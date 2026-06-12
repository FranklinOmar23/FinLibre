import { useState, useEffect } from 'react';
import { LibFull } from './LibSVG';
import { APP_VERSION } from '../utils/appVersion';

const STORAGE_KEY = 'fl_seen_v';

const FEATURES = [
  {
    icon: '💰',
    title: 'Deducciones salariales automáticas',
    desc: 'AFP (2.87 %), SFS (3.04 %) e ISR calculados según los tramos DGII 2025.',
  },
  {
    icon: '📊',
    title: 'Salario neto como base',
    desc: 'Inicio, Plan y Ahorros ahora parten de tu sueldo neto, no del bruto.',
  },
  {
    icon: '⚡',
    title: 'Widget en tiempo real en Perfil',
    desc: 'Edita tu ingreso y ve al instante cuánto te queda tras impuestos.',
  },
];

export default function LibWhatsNew() {
  const [visible, setVisible] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    // Ya vio esta versión → no hacer nada
    if (localStorage.getItem(STORAGE_KEY) === APP_VERSION) return;

    const timer = setTimeout(() => {
      // Re-verificar en el momento exacto de mostrar:
      // si el Tour acaba de cerrar y setear fl_seen_v, no solapar
      if (localStorage.getItem(STORAGE_KEY) === APP_VERSION) return;
      // Usuario nuevo que todavía no completó el tour → no solapar
      if (!localStorage.getItem('fl_tour_done')) return;

      setVisible(true);
      setTimeout(() => setAnimIn(true), 50);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setAnimIn(false);
    setTimeout(() => setVisible(false), 300);
    localStorage.setItem(STORAGE_KEY, APP_VERSION);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(5,15,10,.88)',
      backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      opacity: animIn ? 1 : 0,
      transition: 'opacity .3s ease',
    }}>
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border2)',
        borderRadius: 24,
        padding: '32px 28px',
        width: '100%',
        maxWidth: 420,
        position: 'relative',
        boxShadow: '0 32px 80px rgba(0,0,0,.65)',
        transform: animIn ? 'translateY(0) scale(1)' : 'translateY(20px) scale(.96)',
        transition: 'transform .35s cubic-bezier(.34,1.56,.64,1)',
      }}>
        {/* Top accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg,transparent,var(--green2),transparent)',
          borderRadius: '24px 24px 0 0',
        }} />

        {/* Version badge */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(29,158,117,.13)',
            border: '1px solid rgba(29,158,117,.28)',
            color: 'var(--green2)',
            borderRadius: 20, padding: '4px 14px',
            fontSize: 11, fontWeight: 700,
            letterSpacing: '.08em', textTransform: 'uppercase',
          }}>
            🎉 Novedades · v{APP_VERSION}
          </span>
        </div>

        {/* Lib mascot */}
        <div className="float-anim" style={{ textAlign: 'center', marginBottom: 8 }}>
          <LibFull size={82} />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>
            ¡Hay novedades para ti!
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5 }}>
            Lib te cuenta qué cambió en esta versión
          </div>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: '10px 14px',
            }}>
              <span style={{ fontSize: 20, lineHeight: 1.45, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 2 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={close} style={{
          width: '100%', padding: '13px', borderRadius: 14,
          border: 'none', background: 'var(--green)',
          color: '#fff', fontWeight: 800, fontSize: 14,
          cursor: 'pointer', fontFamily: 'var(--font)',
          boxShadow: '0 4px 16px rgba(29,158,117,.35)',
        }}>
          ¡Entendido! 🚀
        </button>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text4)', marginTop: 10 }}>
          FinLibre v{APP_VERSION}
        </div>
      </div>
    </div>
  );
}
