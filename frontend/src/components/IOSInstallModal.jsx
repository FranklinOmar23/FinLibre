import { X } from 'lucide-react';

const STEPS = [
  {
    n: 1,
    emoji: '⬆️',
    text: 'Toca el botón "Compartir" en la barra inferior de Safari',
  },
  {
    n: 2,
    emoji: '📋',
    text: 'Desliza hacia abajo y toca "Añadir a pantalla de inicio"',
  },
  {
    n: 3,
    emoji: '✅',
    text: 'Toca "Añadir" en la esquina superior derecha para confirmar',
  },
];

export default function IOSInstallModal({ onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9997,
        background: 'rgba(5,15,10,.88)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border2)',
          borderRadius: '20px 20px 0 0',
          padding: '0 20px 36px',
          width: '100%',
          boxShadow: '0 -8px 40px rgba(0,0,0,.55)',
          position: 'relative',
        }}
      >
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--border2)', margin: '14px auto 20px',
        }} />

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'var(--bg3)', border: '1px solid var(--border2)',
            borderRadius: '50%', width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text3)',
          }}
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 24 }}>📲</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginTop: 6 }}>
            Instalar FinLibre en iPhone
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            Sigue estos 3 pasos en Safari
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {STEPS.map((step, i) => (
            <div key={step.n} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 0',
              borderBottom: i < STEPS.length - 1 ? '1px solid var(--border2)' : 'none',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(29,158,117,.13)',
                border: '1px solid rgba(29,158,117,.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: 'var(--green2)',
                fontFamily: 'var(--mono)',
              }}>
                {step.n}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{step.emoji}</span>
                <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.45 }}>
                  {step.text}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Safari tip */}
        <div style={{
          marginTop: 14, padding: '10px 14px',
          background: 'var(--bg3)', borderRadius: 10,
          border: '1px solid var(--border)',
          fontSize: 12, color: 'var(--text3)', textAlign: 'center',
          lineHeight: 1.5,
        }}>
          💡 Debes abrir FinLibre en{' '}
          <strong style={{ color: 'var(--text2)' }}>Safari</strong>{' '}
          para poder instalarla (Chrome en iOS no lo soporta)
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 14,
            padding: '13px', borderRadius: 14,
            border: 'none', background: 'var(--green)',
            color: '#fff', fontWeight: 800, fontSize: 14,
            cursor: 'pointer', fontFamily: 'var(--font)',
            boxShadow: '0 4px 16px rgba(29,158,117,.3)',
          }}
        >
          Entendido ✓
        </button>
      </div>
    </div>
  );
}
