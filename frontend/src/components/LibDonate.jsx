import { useState, useEffect } from 'react';
import { LibFull } from './LibSVG';
import { APP_VERSION } from '../utils/appVersion';
import api from '../api/client';
import { CreditCard } from 'lucide-react';

const STORAGE_KEY = 'fl_donate_last';
const INTERVAL_MS = 21 * 24 * 60 * 60 * 1000; // 21 días

const AMOUNTS = [2, 5, 10];

export default function LibDonate() {
  const [visible, setVisible] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const tourDone = localStorage.getItem('fl_tour_done');
    if (!tourDone) return;

    const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    if (Date.now() - last < INTERVAL_MS) return;

    const seenVersion = localStorage.getItem('fl_seen_v');
    const delay = seenVersion !== APP_VERSION ? 9000 : 22000;

    const timer = setTimeout(() => {
      setVisible(true);
      setTimeout(() => setAnimIn(true), 50);
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setAnimIn(false);
    setTimeout(() => setVisible(false), 300);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  const donar = async (amount) => {
    setSelected(amount);
    setLoading(true);
    try {
      const { data } = await api.post('/stripe/checkout', { amount });
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      window.location.href = data.url;
    } catch {
      window.open('https://ko-fi.com/finlibre', '_blank');
    } finally {
      setLoading(false);
      setSelected(null);
    }
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 90,
      right: 20,
      zIndex: 8886,
      maxWidth: 292,
      opacity: animIn ? 1 : 0,
      transform: animIn ? 'translateY(0) scale(1)' : 'translateY(16px) scale(.94)',
      transition: 'opacity .35s ease, transform .35s cubic-bezier(.34,1.56,.64,1)',
    }}>
      {/* Lib avatar */}
      <div className="float-anim" style={{
        display: 'flex', justifyContent: 'flex-end',
        marginBottom: -8, paddingRight: 12,
      }}>
        <LibFull size={62} />
      </div>

      {/* Bubble */}
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid rgba(255,213,128,.22)',
        borderRadius: '18px 18px 4px 18px',
        padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(255,176,32,.06)',
        position: 'relative',
      }}>
        {/* Amber accent top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg,transparent,#ffd580,transparent)',
          borderRadius: '18px 18px 0 0',
        }} />

        {/* Close */}
        <button onClick={close} style={{
          position: 'absolute', top: 9, right: 10,
          background: 'none', border: 'none',
          color: 'var(--text4)', fontSize: 16,
          cursor: 'pointer', lineHeight: 1, padding: 2,
        }}>×</button>

        {/* Label */}
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#ffd580',
          textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6,
        }}>
          Lib dice ☕
        </div>

        <div style={{
          fontSize: 12, color: 'var(--text2)',
          lineHeight: 1.6, paddingRight: 14, marginBottom: 12,
        }}>
          FinLibre es gratis y sin anuncios. Si te está ayudando, considera apoyar al desarrollador. ¡Cualquier monto mantiene el proyecto vivo!
        </div>

        {/* Amount buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => donar(amt)}
              disabled={loading}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '9px 4px',
                borderRadius: 10,
                border: '1.5px solid rgba(255,176,32,.35)',
                background: selected === amt && loading
                  ? 'linear-gradient(135deg,#ffd580,#ffb020)'
                  : 'rgba(255,176,32,.08)',
                color: selected === amt && loading ? '#1a1000' : '#ffd580',
                fontWeight: 800, fontSize: 13,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font)',
                opacity: loading && selected !== amt ? 0.45 : 1,
                transition: 'all .2s',
              }}
            >
              <CreditCard size={11} />
              ${amt}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', fontSize: 11, color: '#ffd580', marginBottom: 4 }}>
            Abriendo Stripe...
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text4)', marginBottom: 4 }}>
            Pago seguro con Stripe
          </div>
        )}

        <button onClick={close} style={{
          display: 'block', width: '100%',
          background: 'none', border: 'none',
          color: 'var(--text4)', fontSize: 11,
          cursor: 'pointer', padding: '4px 0',
          fontFamily: 'var(--font)', textAlign: 'center',
        }}>
          Quizás después
        </button>
      </div>
    </div>
  );
}
