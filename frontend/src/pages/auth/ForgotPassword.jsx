import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LibSm } from '../../components/LibSVG';
import api from '../../api/client';

export default function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-view">
      <div className="auth-glow" />
      <div className="auth-card">

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div className="logo-badge pulse-anim" style={{ width: 44, height: 44 }}>
            <LibSm size={26} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>FinLibre</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Recuperar acceso</div>
          </div>
        </div>

        {sent ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Revisa tu correo</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7 }}>
                Si el email <strong style={{ color: 'var(--text2)' }}>{email}</strong> está registrado,
                recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </div>
            </div>
            <div className="alert alert-g" style={{ marginBottom: 16 }}>
              <span className="alert-ico">✅</span>
              <div style={{ fontSize: 13 }}>El enlace expira en 30 minutos</div>
            </div>
            <button className="auth-btn" onClick={() => nav('/login')}>
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>¿Olvidaste tu contraseña?</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>
              Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña.
            </div>

            {error && (
              <div className="alert alert-r" style={{ marginBottom: 16 }}>
                <span className="alert-ico">⚠️</span><div>{error}</div>
              </div>
            )}

            <form onSubmit={submit}>
              <div className="field">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 18 }}>
              ¿Recordaste tu contraseña?{' '}
              <span
                style={{ color: 'var(--green2)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => nav('/login')}
              >
                Iniciar sesión
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
