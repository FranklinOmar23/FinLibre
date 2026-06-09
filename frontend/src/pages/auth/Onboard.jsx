import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useLang, LANGUAGES, CURRENCIES } from '../../context/LangContext';
import { LibFull } from '../../components/LibSVG';
import api from '../../api/client';

export default function Onboard() {
  const { user, updateUser } = useAuth();
  const { fetchAll } = useFinance();
  const { t } = useLang();
  const nav = useNavigate();

  const [idioma, setIdioma] = useState(user?.idioma || localStorage.getItem('fl_idioma') || 'es');
  const [moneda, setMoneda] = useState(user?.moneda || localStorage.getItem('fl_moneda') || 'DOP');
  const [saving, setSaving] = useState(false);

  const nombre = user?.nombre?.split(' ')[0] || 'amigo';

  const goApp = async () => {
    setSaving(true);
    try {
      localStorage.setItem('fl_idioma', idioma);
      localStorage.setItem('fl_moneda', moneda);
      const res = await api.put('/users/profile', { idioma, moneda });
      updateUser(res.data.user);
      await fetchAll();
      nav('/app');
    } catch {
      await fetchAll();
      nav('/app');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-view">
      <div className="auth-glow" />
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 24,
        padding: '40px 36px', width: '100%', maxWidth: 480,
        boxShadow: '0 24px 80px rgba(0,0,0,.5)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,var(--green2),transparent)' }} />

        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
          {[1,2,3].map((d) => (
            <div key={d} style={{ height: 4, borderRadius: 2, background: 'var(--green)', width: d === 3 ? 44 : 28 }} />
          ))}
        </div>

        <div className="float-anim" style={{ marginBottom: 16, textAlign: 'center' }}>
          <LibFull size={88} />
        </div>

        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: -0.3, textAlign: 'center' }}>
          {t('onboard_hello', { name: nombre })}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.55, textAlign: 'center' }}>
          {t('onboard_intro_strong') === 'Lib'
            ? <><strong style={{ color: 'var(--green2)' }}>Lib</strong>{t('onboard_intro')}<br />{t('onboard_intro2')}</>
            : <>{t('onboard_intro_strong')}{t('onboard_intro')}<br />{t('onboard_intro2')}</>}
        </div>

        <div className="lib-bubble" style={{ marginBottom: 24, textAlign: 'left' }}>
          {t('onboard_bubble')}
        </div>

        {/* Language selection */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>
            {t('onboard_choose_lang')}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setIdioma(l.code)}
                style={{
                  flex: 1, padding: '10px 6px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${idioma === l.code ? 'var(--green)' : 'var(--border2)'}`,
                  background: idioma === l.code ? 'rgba(29,158,117,.15)' : 'var(--bg3)',
                  color: idioma === l.code ? 'var(--green2)' : 'var(--text2)',
                  fontWeight: 700, fontSize: 13, transition: 'all .2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  fontFamily: 'var(--font)',
                }}
              >
                <span style={{ fontSize: 22 }}>{l.flag}</span>
                <span style={{ fontSize: 11 }}>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Currency selection */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>
            {t('onboard_choose_currency')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setMoneda(c.code)}
                style={{
                  padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${moneda === c.code ? 'var(--green)' : 'var(--border2)'}`,
                  background: moneda === c.code ? 'rgba(29,158,117,.15)' : 'var(--bg3)',
                  color: moneda === c.code ? 'var(--green2)' : 'var(--text2)',
                  fontWeight: 700, fontSize: 11, transition: 'all .2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  fontFamily: 'var(--font)',
                }}
              >
                <span style={{ fontSize: 18 }}>{c.flag}</span>
                <span style={{ fontSize: 10, fontWeight: 800 }}>{c.code}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[['💰', t('onboard_income')], ['📋', t('onboard_services')], ['💳', t('onboard_debts')]].map(([icon, text]) => (
            <div key={text} style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 5 }}>{icon}</div>
              <div style={{ fontSize: 10, color: 'var(--text2)', lineHeight: 1.4 }}>{text}</div>
            </div>
          ))}
        </div>

        <button className="auth-btn" onClick={goApp} disabled={saving}>
          {saving ? '...' : t('onboard_start')}
        </button>
        <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 14, textAlign: 'center' }}>
          {t('onboard_skip')}
        </div>
      </div>
    </div>
  );
}
