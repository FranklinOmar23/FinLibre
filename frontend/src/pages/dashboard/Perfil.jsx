import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useLang, LANGUAGES, CURRENCIES } from '../../context/LangContext';
import { LibFull } from '../../components/LibSVG';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useBiometric } from '../../hooks/useBiometric';
import api from '../../api/client';
import {
  Bell, Fingerprint, Heart, Users, Download, LogOut,
  ChevronRight, CalendarDays, Check, CheckCircle2,
  AlertTriangle, XCircle, CreditCard, Globe, DollarSign,
} from 'lucide-react';


function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function Perfil() {
  const { user, logout, updateUser } = useAuth();
  const { debts, services } = useFinance();
  const { t, fmt, idioma: currentIdioma, moneda: currentMoneda } = useLang();
  const nav = useNavigate();
  const loc = useLocation();
  const push = usePushNotifications();
  const biometric = useBiometric();

  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    ingreso_mensual: user?.ingreso_mensual || '',
    idioma: user?.idioma || currentIdioma || 'es',
    moneda: user?.moneda || currentMoneda || 'DOP',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [donated, setDonated] = useState(() => new URLSearchParams(loc.search).get('donated') === 'true');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioRegistered, setBioRegistered] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioStatus, setBioStatus] = useState('');
  const [bioMsg, setBioMsg] = useState('');

  const nombre = user?.nombre?.split(' ')[0] || '';
  const iniciales = (user?.nombre || 'FL').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

  const maxMeses = debts.length
    ? Math.max(...debts.map((d) => {
        const r = parseFloat(d.monto_total) - parseFloat(d.monto_pagado);
        return Math.ceil(r / parseFloat(d.cuota_mensual));
      }))
    : 0;

  const diasActivo = user?.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt)) / 86400000)
    : 0;

  useEffect(() => {
    biometric.isPlatformAvailable().then(setBioAvailable);
    api.get('/webauthn/credentials')
      .then(r => setBioRegistered(r.data.length > 0))
      .catch(() => {});
  }, []);

  const guardar = async () => {
    setSaving(true);
    try {
      localStorage.setItem('fl_idioma', form.idioma);
      localStorage.setItem('fl_moneda', form.moneda);
      const res = await api.put('/users/profile', form);
      updateUser(res.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterBiometric = async () => {
    setBioLoading(true); setBioMsg('');
    try {
      await biometric.registerBiometric();
      setBioRegistered(true); setBioStatus('success');
      setBioMsg(t('perfil_bio_ok'));
    } catch (err) {
      setBioStatus('error'); setBioMsg(err.message || t('perfil_bio_activating'));
    } finally { setBioLoading(false); }
  };

  const handleRemoveBiometric = async () => {
    setBioLoading(true);
    try {
      const creds = await api.get('/webauthn/credentials');
      await Promise.all(creds.data.map(c => api.delete(`/webauthn/credentials/${c.id}`)));
      setBioRegistered(false); setBioStatus('info'); setBioMsg(t('perfil_bio_remove'));
    } finally { setBioLoading(false); }
  };

  const handleLogout = () => { logout(); nav('/'); };

  const donar = async (amount) => {
    setStripeLoading(true);
    try {
      const { data } = await api.post('/stripe/checkout', { amount });
      window.location.href = data.url;
    } catch {
      window.open('https://ko-fi.com/finlibre', '_blank');
    } finally {
      setStripeLoading(false);
    }
  };

  return (
    <div className="view">
      <div className="topbar">
        <div>
          <div className="page-title">{t('perfil_title')}</div>
          <div className="page-sub">{t('perfil_sub')}</div>
        </div>
      </div>

      <div className="g2" style={{ alignItems: 'start' }}>
        {/* ── Columna izquierda ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div className="card" style={{ textAlign: 'center', padding: '30px 24px' }}>
            <div className="float-anim" style={{ marginBottom: 14 }}><LibFull size={100} /></div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{t('perfil_lib_desc').split(' ')[0]}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 18 }}>{t('perfil_lib_desc')}</div>
            <div className="lib-bubble" style={{ textAlign: 'left' }}>
              <span dangerouslySetInnerHTML={{ __html: `"${t('perfil_lib_bubble', { name: escHtml(nombre), n: diasActivo })} ${maxMeses > 0 ? t('perfil_lib_debts', { n: maxMeses }) : t('perfil_lib_free')}"` }} />
            </div>
          </div>

          <div className="card">
            <div className="sec-label">{t('perfil_account')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0, boxShadow: '0 0 18px rgba(29,158,117,.3)' }}>{iniciales}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{user?.email}</div>
                <span className="chip chip-g" style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Check size={11} strokeWidth={2.5} /> {t('perfil_active')}
                </span>
              </div>
            </div>
            <div className="g3" style={{ gap: 10 }}>
              {[
                { val: maxMeses > 0 ? `${maxMeses}m` : '🎉', label: t('perfil_to_free'), color: 'var(--green2)' },
                { val: debts.length,    label: t('perfil_debts_stat'),    color: 'var(--red)'   },
                { val: services.length, label: t('perfil_services_stat'), color: 'var(--blue)'  },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--rsm)', padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {user?.frecuencia_cobro && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <CalendarDays size={15} style={{ color: 'var(--green2)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 1 }}>{t('perfil_cobro')}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {user.frecuencia_cobro === 'quincenal'
                      ? t('perfil_cobro_bi', { n: user.dia_cobro })
                      : t('perfil_cobro_mo', { n: user.dia_cobro })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <div className="sec-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Heart size={12} style={{ color: 'var(--green2)' }} /> {t('perfil_support')}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.65 }}>
              {t('perfil_support_desc')}
            </p>
            {donated && (
              <div className="alert alert-g" style={{ marginBottom: 4 }}>
                <span className="alert-ico"><CheckCircle2 size={16} /></span>
                <div>¡Gracias por apoyar FinLibre! 🐊💚</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Stripe — montos de donación */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[2, 5, 10].map(amt => (
                  <button
                    key={amt}
                    onClick={() => donar(amt)}
                    disabled={stripeLoading}
                    className="btn btn-o"
                    style={{ flex: 1, justifyContent: 'center', padding: '10px 4px', borderRadius: 12, fontSize: 13, fontWeight: 700, opacity: stripeLoading ? .6 : 1 }}
                  >
                    <CreditCard size={13} /> ${amt}
                  </button>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text4)', marginTop: -2 }}>
                {stripeLoading ? 'Abriendo Stripe...' : t('perfil_stripe')}
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--text4)' }}>
              {t('perfil_donate_note')}
            </div>
          </div>
        </div>

        {/* ── Columna derecha ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div className="card">
            <div className="sec-label">{t('perfil_my_data')}</div>
            {saved && (
              <div className="alert alert-g" style={{ marginBottom: 12 }}>
                <span className="alert-ico"><CheckCircle2 size={16} /></span>
                <div>{t('perfil_saved_ok')}</div>
              </div>
            )}
            <div className="field"><label>{t('perfil_name')}</label><input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div className="field"><label>{t('perfil_income')}</label><input type="number" value={form.ingreso_mensual} onChange={(e) => setForm({ ...form, ingreso_mensual: e.target.value })} /></div>

            {/* Language */}
            <div className="field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={13} /> {t('perfil_language')}</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {LANGUAGES.map((l) => (
                  <button key={l.code} type="button" onClick={() => setForm({ ...form, idioma: l.code })}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${form.idioma === l.code ? 'var(--green)' : 'var(--border2)'}`,
                      background: form.idioma === l.code ? 'rgba(29,158,117,.15)' : 'var(--bg3)',
                      color: form.idioma === l.code ? 'var(--green2)' : 'var(--text2)',
                      fontWeight: 700, fontSize: 11, fontFamily: 'var(--font)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    }}>
                    <span style={{ fontSize: 18 }}>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div className="field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><DollarSign size={13} /> {t('perfil_currency')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {CURRENCIES.map((c) => (
                  <button key={c.code} type="button" onClick={() => setForm({ ...form, moneda: c.code })}
                    style={{
                      padding: '6px 4px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${form.moneda === c.code ? 'var(--green)' : 'var(--border2)'}`,
                      background: form.moneda === c.code ? 'rgba(29,158,117,.15)' : 'var(--bg3)',
                      color: form.moneda === c.code ? 'var(--green2)' : 'var(--text2)',
                      fontWeight: 700, fontSize: 10, fontFamily: 'var(--font)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    }}>
                    <span style={{ fontSize: 16 }}>{c.flag}</span>
                    <span style={{ fontWeight: 800 }}>{c.code}</span>
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-p" style={{ width: '100%', justifyContent: 'center' }} onClick={guardar} disabled={saving}>
              {saving ? t('perfil_saving') : t('perfil_save_btn')}
            </button>
          </div>

          <div className="card">
            <div className="sec-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bell size={12} /> {t('perfil_notif')}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.6 }}>
              {t('perfil_notif_desc')}
            </p>
            {!push.isSupported ? (
              <div className="alert alert-a">
                <span className="alert-ico"><AlertTriangle size={16} /></span>
                <div>{t('perfil_notif_no')}</div>
              </div>
            ) : push.subscribed ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="alert alert-g">
                  <span className="alert-ico"><CheckCircle2 size={16} /></span>
                  <div>{t('perfil_notif_active')}</div>
                </div>
                <button className="btn btn-o" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }} onClick={push.testPush}>{t('perfil_notif_test')}</button>
                <button className="btn btn-r" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }} onClick={push.unsubscribe} disabled={push.loading}>{t('perfil_notif_off')}</button>
              </div>
            ) : (
              <button className="btn btn-p" style={{ width: '100%', justifyContent: 'center', gap: 8 }} onClick={push.subscribe} disabled={push.loading}>
                <Bell size={15} /> {push.loading ? t('perfil_notif_on_loading') : t('perfil_notif_on')}
              </button>
            )}
          </div>

          {bioAvailable && (
            <div className="card">
              <div className="sec-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Fingerprint size={12} /> {t('perfil_bio')}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.6 }}>{t('perfil_bio_desc')}</p>
              {bioMsg && (
                <div className={`alert ${bioStatus === 'success' ? 'alert-g' : bioStatus === 'error' ? 'alert-r' : 'alert-a'}`} style={{ marginBottom: 12 }}>
                  <span className="alert-ico">
                    {bioStatus === 'success' ? <CheckCircle2 size={16} /> : bioStatus === 'error' ? <XCircle size={16} /> : <AlertTriangle size={16} />}
                  </span>
                  <div>{bioMsg}</div>
                </div>
              )}
              {bioRegistered ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="alert alert-g">
                    <span className="alert-ico"><Fingerprint size={16} /></span>
                    <div>{t('perfil_bio_ok')}</div>
                  </div>
                  <button className="btn btn-r" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }} onClick={handleRemoveBiometric} disabled={bioLoading}>
                    {bioLoading ? t('perfil_bio_removing') : t('perfil_bio_remove')}
                  </button>
                </div>
              ) : (
                <button className="btn btn-p" style={{ width: '100%', justifyContent: 'center', gap: 8 }} onClick={handleRegisterBiometric} disabled={bioLoading}>
                  <Fingerprint size={15} /> {bioLoading ? t('perfil_bio_activating') : t('perfil_bio_activate')}
                </button>
              )}
            </div>
          )}

          <div className="card" style={{ padding: '10px 8px' }}>
            <div style={{ padding: '6px 8px 2px' }}><div className="sec-label">{t('perfil_more')}</div></div>
            {[
              { Icon: Users,    bg: 'rgba(239,159,39,.1)',  title: t('perfil_finduo'),  sub: t('perfil_finduo_sub')  },
              { Icon: Download, bg: 'rgba(29,158,117,.1)',  title: t('perfil_export'),  sub: t('perfil_export_sub')  },
            ].map((item) => (
              <div key={item.title} className="menu-item">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="menu-ico" style={{ background: item.bg }}><item.Icon size={17} /></div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{item.sub}</div>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--text4)' }} />
              </div>
            ))}
          </div>

          <button className="btn btn-r" style={{ width: '100%', justifyContent: 'center', gap: 8 }} onClick={handleLogout}>
            <LogOut size={15} /> {t('perfil_logout')}
          </button>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text4)' }}>
            {t('perfil_version')}
          </div>
        </div>
      </div>
    </div>
  );
}
