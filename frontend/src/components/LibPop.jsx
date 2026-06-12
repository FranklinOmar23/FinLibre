import { useState, useEffect } from 'react';
import { LibFull } from './LibSVG';

const MESSAGES = [
  {
    msg: 'Tip: ¡Activa las notificaciones push y te recuerdo tus días de cobro automáticamente! Ve a tu Perfil para activarlas. 🔔',
    action: null,
  },
  {
    msg: '¿Sabías que el asistente de IA puede analizar tus finanzas y darte un plan personalizado? ¡Pruébalo en la sección Plan! 🤖',
    action: null,
  },
  {
    msg: 'Registrar tus servicios y suscripciones te ayuda a detectar gastos que ni recuerdas que tienes. ¡Muchos ahorran hasta un 20% así! 💡',
    action: null,
  },
  {
    msg: 'FinLibre es un proyecto independiente hecho con mucho amor. Si te gusta, compártelo con alguien que lo necesite. 🙌',
    action: null,
  },
  {
    msg: '¿Tienes deudas activas? Registra todas en FinLibre y te aviso cuando se acerque la fecha de pago. Sin sorpresas. 💳',
    action: null,
  },
  {
    msg: '¡Hola de nuevo! Recuerda que puedes cambiar tu moneda e idioma en cualquier momento desde tu Perfil. 🌎',
    action: null,
  },
  {
    msg: 'Revisa la sección de Ahorros y crea una meta para tu fondo de emergencia. Lo ideal es tener 3 meses de gastos guardados. 🐷',
    action: null,
  },
];

const STORAGE_KEY = 'fl_pop_last';
const INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // 3 días

export default function LibPop() {
  const [visible, setVisible] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    const now = Date.now();
    if (now - last >= INTERVAL_MS) {
      const idx = Math.floor(Math.random() * MESSAGES.length);
      setMsgIndex(idx);
      // Delay para no aparecer al mismo tiempo que el tour
      const delay = localStorage.getItem('fl_tour_done') ? 12000 : 90000;
      const t = setTimeout(() => {
        setVisible(true);
        setTimeout(() => setAnimIn(true), 50);
      }, delay);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    setAnimIn(false);
    setTimeout(() => setVisible(false), 300);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  if (!visible) return null;

  const current = MESSAGES[msgIndex];

  return (
    <div style={{
      position: 'fixed',
      bottom: 90,
      right: 20,
      zIndex: 8888,
      maxWidth: 300,
      opacity: animIn ? 1 : 0,
      transform: animIn ? 'translateY(0) scale(1)' : 'translateY(16px) scale(.94)',
      transition: 'opacity .35s ease, transform .35s cubic-bezier(.34,1.56,.64,1)',
    }}>
      {/* Lib avatar */}
      <div className="float-anim" style={{
        display: 'flex', justifyContent: 'flex-end', marginBottom: -8, paddingRight: 12,
      }}>
        <LibFull size={64} />
      </div>

      {/* Bubble */}
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border2)',
        borderRadius: '18px 18px 4px 18px',
        padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,.45)',
        position: 'relative',
      }}>
        {/* Close */}
        <button onClick={close} style={{
          position: 'absolute', top: 8, right: 10,
          background: 'none', border: 'none',
          color: 'var(--text4)', fontSize: 16,
          cursor: 'pointer', lineHeight: 1, padding: 2,
        }}>×</button>

        {/* Lib label */}
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--green2)',
          textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6,
        }}>
          Lib dice
        </div>

        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55, paddingRight: 12 }}>
          {current.msg}
        </div>

        {current.action && (
          <a
            href={current.action.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            style={{
              display: 'inline-block', marginTop: 10,
              background: 'var(--green)', color: '#fff',
              padding: '7px 14px', borderRadius: 8,
              fontSize: 12, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(29,158,117,.35)',
            }}
          >
            {current.action.label}
          </a>
        )}

        <button onClick={close} style={{
          display: 'block', marginTop: 8,
          background: 'none', border: 'none',
          color: 'var(--text4)', fontSize: 11,
          cursor: 'pointer', padding: 0, fontFamily: 'var(--font)',
        }}>
          Entendido ✓
        </button>
      </div>
    </div>
  );
}
