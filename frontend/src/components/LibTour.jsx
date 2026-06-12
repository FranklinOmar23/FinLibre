import { useState, useEffect } from 'react';
import { LibFull } from './LibSVG';
import { APP_VERSION } from '../utils/appVersion';

const STEPS = [
  {
    icon: '👋',
    title: '¡Bienvenido a FinLibre!',
    msg: 'Soy Lib, tu guía financiero personal. Voy a mostrarte todo lo que puedes hacer aquí en menos de un minuto. ¡Vamos!',
  },
  {
    icon: '📊',
    title: 'Inicio — Tu panel central',
    msg: 'Aquí ves un resumen completo: tus ingresos, cuánto has gastado, tus deudas activas y el progreso de tus ahorros. Todo en un vistazo.',
  },
  {
    icon: '📋',
    title: 'Servicios — Tus suscripciones',
    msg: 'Registra Netflix, Spotify, gym, internet... todo lo que pagas recurrentemente. Sabrás exactamente cuánto se va cada mes sin darte cuenta.',
  },
  {
    icon: '💳',
    title: 'Deudas — Control total',
    msg: 'Añade tus deudas y te recuerdo cada día de cobro. Puedes ver cuánto debes, las cuotas y marcar pagos para ir liquidándolas.',
  },
  {
    icon: '🐷',
    title: 'Ahorros — Tu dinero crece',
    msg: 'Crea metas de ahorro: vacaciones, emergencias, lo que quieras. Registra cada aporte y yo te muestro cuánto te falta para lograrlo.',
  },
  {
    icon: '🧭',
    title: 'Plan — IA financiera',
    msg: 'Tu asesor financiero con inteligencia artificial. Analiza tus finanzas, detecta gastos innecesarios y te da un plan personalizado.',
  },
  {
    icon: '🚀',
    title: '¡Todo listo!',
    msg: 'Ya conoces FinLibre. Recuerda que siempre puedes preguntarme lo que necesites usando el chat. ¡Empecemos a mejorar tus finanzas!',
  },
];

const STORAGE_KEY = 'fl_tour_done';

export default function LibTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTimeout(() => {
        setVisible(true);
        setTimeout(() => setAnimIn(true), 50);
      }, 800);
    }
  }, []);

  const close = () => {
    setAnimIn(false);
    setTimeout(() => setVisible(false), 300);
    localStorage.setItem(STORAGE_KEY, '1');
    // Marca la versión actual para que el WhatsNew no aparezca a usuarios recién registrados
    localStorage.setItem('fl_seen_v', APP_VERSION);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      close();
    }
  };

  const prev = () => step > 0 && setStep(s => s - 1);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(5,15,10,.82)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      opacity: animIn ? 1 : 0,
      transition: 'opacity .3s ease',
    }}>
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border2)',
        borderRadius: 24,
        padding: '36px 32px',
        width: '100%',
        maxWidth: 420,
        position: 'relative',
        boxShadow: '0 32px 80px rgba(0,0,0,.6)',
        transform: animIn ? 'translateY(0) scale(1)' : 'translateY(20px) scale(.96)',
        transition: 'transform .35s cubic-bezier(.34,1.56,.64,1)',
      }}>
        {/* Top line accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,var(--green2),transparent)', borderRadius: '24px 24px 0 0' }} />

        {/* Skip button */}
        <button onClick={close} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'var(--bg3)', border: '1px solid var(--border2)',
          color: 'var(--text3)', borderRadius: 8, padding: '4px 10px',
          fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font)',
        }}>
          Saltar
        </button>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: 4, borderRadius: 2, transition: 'all .3s',
              background: i === step ? 'var(--green)' : i < step ? 'var(--green2)' : 'var(--bg4)',
              width: i === step ? 24 : 8,
            }} />
          ))}
        </div>

        {/* Lib mascot */}
        <div className="float-anim" style={{ textAlign: 'center', marginBottom: 8 }}>
          <LibFull size={90} />
        </div>

        {/* Icon + title */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>{current.icon}</div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>{current.title}</div>
        </div>

        {/* Speech bubble */}
        <div style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '14px 18px',
          fontSize: 13,
          color: 'var(--text2)',
          lineHeight: 1.6,
          marginBottom: 24,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '8px solid var(--border)',
          }} />
          <div style={{
            position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderBottom: '7px solid var(--bg3)',
          }} />
          {current.msg}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button onClick={prev} style={{
              flex: 1, padding: '12px', borderRadius: 12,
              border: '2px solid var(--border2)', background: 'var(--bg3)',
              color: 'var(--text2)', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', fontFamily: 'var(--font)',
            }}>
              ← Atrás
            </button>
          )}
          <button onClick={next} style={{
            flex: 2, padding: '12px', borderRadius: 12,
            border: 'none', background: 'var(--green)',
            color: '#fff', fontWeight: 800, fontSize: 14,
            cursor: 'pointer', fontFamily: 'var(--font)',
            boxShadow: '0 4px 16px rgba(29,158,117,.35)',
          }}>
            {isLast ? '¡Empezar! 🚀' : 'Siguiente →'}
          </button>
        </div>

        {/* Step counter */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text4)', marginTop: 12 }}>
          {step + 1} de {STEPS.length}
        </div>
      </div>
    </div>
  );
}
