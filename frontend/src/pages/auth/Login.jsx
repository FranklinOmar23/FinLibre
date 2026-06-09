import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { LibSm } from '../../components/LibSVG';
import { useBiometric } from '../../hooks/useBiometric';
import api from '../../api/client';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function LoginInner() {
  const { login, loginWithToken } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();
  const biometric = useBiometric();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const googleLogin = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      setGoogleLoading(true); setError('');
      try {
        const res = await api.post('/auth/google', { access_token });
        loginWithToken(res.data.token, res.data.user);
        nav('/app');
      } catch {
        setError(t('login_error_google'));
      } finally { setGoogleLoading(false); }
    },
    onError: () => setError(t('login_error_google')),
  });

  const handleBiometric = async () => {
    if (!form.email) { setError(t('login_error_bio')); return; }
    setError(''); setBioLoading(true);
    try {
      const data = await biometric.loginWithBiometric(form.email);
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
              <span style={{ fontSize: 11, color: 'var(--green2)', cursor: 'pointer', fontWeight: 500 }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '.05em' }}>{t('login_or')}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
        </div>

        <button type="button" onClick={() => googleLogin()} disabled={googleLoading}
          style={{
            width: '100%', padding: '13px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'var(--bg3)', border: '1px solid var(--border2)',
            borderRadius: 14, cursor: 'pointer', color: 'var(--text)',
            fontSize: 14, fontWeight: 600, fontFamily: 'var(--font)', transition: 'all .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
          {googleLoading ? (
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>{t('login_connecting')}</span>
          ) : (
            <><GoogleIcon /><span>{t('login_google')}</span></>
          )}
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 18 }}>
          {t('login_no_account')}{' '}
          <span style={{ color: 'var(--green2)', cursor: 'pointer', fontWeight: 600 }} onClick={() => nav('/register')}>
            {t('login_register_link')}
          </span>
        </div>

        <div style={{ marginTop: 14, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 14, cursor: 'pointer' }}>
          <span style={{ fontSize: 18 }}>🔗</span>
          <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
            {t('login_finduo')} <span style={{ color: 'var(--green2)' }}>{t('login_finduo_sub')}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginInner />
    </GoogleOAuthProvider>
  ) : <LoginInner />;
}
