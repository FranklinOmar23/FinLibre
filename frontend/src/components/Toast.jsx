import { useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const show = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const toast = {
    success: (msg, ms) => show(msg, 'success', ms),
    error:   (msg, ms) => show(msg, 'error', ms),
    info:    (msg, ms) => show(msg, 'info', ms),
  };

  return { toasts, dismiss: (id) => setToasts(prev => prev.filter(t => t.id !== id)), toast };
}

// ── Renderer ──────────────────────────────────────────────────────────────────
const CONFIGS = {
  success: { Icon: CheckCircle2, color: 'var(--green2)',  bg: 'rgba(29,158,117,.12)', border: 'rgba(29,158,117,.3)' },
  error:   { Icon: XCircle,      color: 'var(--red)',     bg: 'rgba(224,82,82,.12)',  border: 'rgba(224,82,82,.3)' },
  info:    { Icon: Info,         color: '#5ba4e0',        bg: 'rgba(91,164,224,.12)', border: 'rgba(91,164,224,.3)' },
};

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const cfg = CONFIGS[toast.type] || CONFIGS.info;
  const { Icon } = cfg;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 14px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,.35)',
        minWidth: 260, maxWidth: 360,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        opacity: visible ? 1 : 0,
        transition: 'transform .25s ease, opacity .25s ease',
        pointerEvents: 'all',
      }}
    >
      <Icon size={17} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text1)', lineHeight: 1.45 }}>
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text4)', flexShrink: 0 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, dismiss }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
      alignItems: 'flex-end', pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
