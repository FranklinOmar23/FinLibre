import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { LibSm } from '../../components/LibSVG';
import api from '../../api/client';
import { Mail, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function VerifyEmail() {
  const { token } = useParams();
  const { user, updateUser } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();

  // 'pending' = esperando que el usuario abra el email
  // 'verifying' = procesando el token
  // 'success' = verificado ok
  // 'error' = token inválido
  const [status, setStatus] = useState(token ? 'verifying' : 'pending');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendOk, setResendOk] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get(`/auth/verify-email/${token}`)
      .then(() => {
        setStatus('success');
        if (updateUser) updateUser({ email_verified: true });
      })
      .catch(() => setStatus('error'));
  }, [token]);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification');
      setResendOk(true);
    } catch (_) {}
    finally { setResendLoading(false); }
  };

  return (
    <div className="auth-view">
      <div className="auth-glow" />
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div className="logo-badge" style={{ width: 40, height: 40 }}><LibSm size={22} /></div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>FinLibre</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{t('verify_subtitle')}</div>
          </div>
        </div>

        {status === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 14 }}>
            {t('verify_verifying')}
          </div>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <CheckCircle2 size={52} style={{ color: 'var(--green2)', marginBottom: 16 }} />
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t('verify_success_title')}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 28, lineHeight: 1.65 }}>{t('verify_success_msg')}</div>
            <button className="auth-btn" onClick={() => nav('/app')}>{t('verify_go_app')}</button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <XCircle size={52} style={{ color: 'var(--red)', marginBottom: 16 }} />
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t('verify_error_title')}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 28, lineHeight: 1.65 }}>{t('verify_error_msg')}</div>
            <button className="auth-btn" onClick={() => nav('/app')}>{t('verify_go_app')}</button>
          </div>
        )}

        {status === 'pending' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Mail size={52} style={{ color: 'var(--green2)', marginBottom: 16 }} />
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{t('verify_title')}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7 }}>
                {t('verify_pending_msg', { email: user?.email || '' })}
              </div>
            </div>

            <div className="alert alert-a" style={{ marginBottom: 16 }}>
              <span className="alert-ico">🔒</span>
              <div style={{ fontSize: 12 }}>{t('verify_blocked_msg')}</div>
            </div>

            {resendOk ? (
              <div className="alert alert-g">
                <span className="alert-ico"><CheckCircle2 size={16} /></span>
                <div>{t('verify_resent')}</div>
              </div>
            ) : (
              <button
                className="auth-btn"
                style={{ marginTop: 0 }}
                onClick={handleResend}
                disabled={resendLoading}
              >
                <RefreshCw size={14} style={{ display: 'inline', marginRight: 8 }} />
                {resendLoading ? t('verify_resending') : t('verify_resend')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
