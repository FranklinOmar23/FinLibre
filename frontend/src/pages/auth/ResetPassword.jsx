import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LibSm } from '../../components/LibSVG';
import api from '../../api/client';

export default function ResetPassword() {
  const nav = useNavigate();
  const [params]  = useSearchParams();
  const token     = params.get('token') || '';

  const [form, setForm]       = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!token) nav('/forgot-password', { replace: true });
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8)
      return setError('La contraseña debe tener al menos 8 caracteres');

    if (form.password !== form.confirm)
      return setError('Las contraseñas no coinciden');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Enlace inválido o expirado');
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
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Nueva contraseña</div>
          </div>
        </div>

        {done ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>¡Contraseña actualizada!</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7 }}>
                Tu contraseña fue cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </div>
            </div>
            <div className="alert alert-g" style={{ marginBottom: 16 }}>
              <span className="alert-ico">✅</span>
              <div style={{ fontSize: 13 }}>Recibirás un correo de confirmación</div>
            </div>
            <button className="auth-btn" onClick={() => nav('/login')}>
              Iniciar sesión
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Crear nueva contraseña</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>
              Elige una contraseña segura de al menos 8 caracteres.
            </div>

            {error && (
              <div className="alert alert-r" style={{ marginBottom: 16 }}>
                <span className="alert-ico">⚠️</span><div>{error}</div>
              </div>
            )}

            <form onSubmit={submit}>
              <div className="field">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="new-password"
                  autoFocus
                  minLength={8}
                />
              </div>
              <div className="field">
                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>

              {form.password && form.confirm && form.password !== form.confirm && (
                <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12, marginTop: -8 }}>
                  Las contraseñas no coinciden
                </div>
              )}

              <button
                className="auth-btn"
                type="submit"
                disabled={loading || !form.password || !form.confirm}
              >
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
