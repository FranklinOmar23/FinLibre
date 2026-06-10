import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { LibSm } from '../../components/LibSVG';
import { useBiometric } from '../../hooks/useBiometric';

export default function Login() {
  const { login, loginWithToken } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();
  const biometric = useBiometric();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  useEffect(() => { biometric.isPlatformAvailable().then(setBioAvailable); }, []);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      nav('/app');
    } catch (err) {
      setError(err.response?.data?.message || t('login_error'));
    } finally { setLoading(false); }
  };

  const handleBiometric = async () => {
    setError(''); setBioLoading(true);
    try {
      const data = await biometric.loginWithBiometric(form.email || null);
      loginWithToken(data.token, data.user);
      nav('/app');
    } catch (err) {
      setError(err.response?.data?.error || t('login_error'));
    } finally { setBioLoading(false); }
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
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{t('login_welcome_back')}</div>
          </div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{t('login_title')}</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>{t('login_subtitle')}</div>

        {error && (
          <div className="alert alert-r" style={{ marginBottom: 16 }}>
            <span className="alert-ico">⚠️</span><div>{error}</div>
          </div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label>{t('login_email')}</label>
            <input type="email" name="email" placeholder="tu@correo.com" value={form.email} onChange={handle} required autoComplete="email" />
          </div>
          <div className="field">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('login_password')}</span>
              <span
                style={{ fontSize: 11, color: 'var(--green2)', cursor: 'pointer', fontWeight: 500 }}
                onClick={() => nav('/forgot-password')}
              >
                {t('login_forgot')}
              </span>
            </label>
            <input type="password" name="password" placeholder="••••••••" value={form.password} onChange={handle} required autoComplete="current-password" />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? t('login_loading') : t('login_btn')}
          </button>
        </form>

        {bioAvailable && (
          <button type="button" onClick={handleBiometric} disabled={bioLoading}
            style={{
              width: '100%', marginTop: 10, padding: '13px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'var(--bg3)', border: '1px solid var(--border2)',
              borderRadius: 14, cursor: 'pointer', color: 'var(--text)',
              fontSize: 14, fontWeight: 600, fontFamily: 'var(--font)', transition: 'all .2s',
            }}>
            <span style={{ fontSize: 18 }}>🔐</span>
            {bioLoading ? t('login_bio_loading') : t('login_biometric')}
          </button>
        )}

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 20 }}>
          {t('login_no_account')}{' '}
          <span style={{ color: 'var(--green2)', cursor: 'pointer', fontWeight: 600 }} onClick={() => nav('/register')}>
            {t('login_register_link')}
          </span>
        </div>
      </div>
    </div>
  );
}
