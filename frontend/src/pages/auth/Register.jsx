import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { LibSm } from '../../components/LibSVG';

function PwdStrength({ pwd, t }) {
  const len = pwd.length;
  const bars = [
    len >= 1 ? (len < 5 ? 'var(--red)' : len < 8 ? 'var(--amber)' : 'var(--blue)') : 'var(--bg4)',
    len >= 5 ? (len < 8 ? 'var(--amber)' : 'var(--blue)') : 'var(--bg4)',
    len >= 8 ? (len < 12 ? 'var(--blue)' : 'var(--green)') : 'var(--bg4)',
    len >= 12 ? 'var(--green)' : 'var(--bg4)',
  ];
  const label = !len ? '' : len < 5 ? t('register_pwd_weak') : len < 8 ? t('register_pwd_fair') : len < 12 ? t('register_pwd_good') : t('register_pwd_strong');
  const labelColor = !len ? '' : len < 5 ? 'var(--red)' : len < 8 ? 'var(--amber)' : len < 12 ? 'var(--blue)' : 'var(--green2)';
  return (
    <>
      <div className="pwd-strength">
        {bars.map((bg, i) => <div key={i} className="pwd-bar" style={{ background: bg }} />)}
      </div>
      {label && <div style={{ fontSize: 10, color: labelColor, marginTop: 4 }}>{label}</div>}
    </>
  );
}

const TOTAL_STEPS = 4;

export default function Register() {
  const { register } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', ingreso_mensual: '', frecuencia_cobro: '', dia_cobro: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const nextStep = (e) => { e.preventDefault(); setStep((s) => s + 1); };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form.nombre, form.email, form.password,
        parseFloat(form.ingreso_mensual) || 0,
        form.frecuencia_cobro || null,
        parseInt(form.dia_cobro) || null,
      );
      nav('/onboard');
    } catch (err) {
      setError(err.response?.data?.message || t('register_error'));
      setStep(1);
    } finally { setLoading(false); }
  };

  const diasOpciones =
    form.frecuencia_cobro === 'quincenal'
      ? Array.from({ length: 16 }, (_, i) => i + 16)   // 16–31
      : Array.from({ length: 31 }, (_, i) => i + 1);   // 1–31

  const stepNames = t('register_step_names');

  return (
    <div className="auth-view">
      <div className="auth-glow" />
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div className="logo-badge" style={{ width: 44, height: 44 }}><LibSm size={26} /></div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>FinLibre</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{t('register_new_account')}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((d) => (
            <div key={d} style={{
              height: 4, borderRadius: 2, transition: 'all .3s',
              background: d < step ? 'var(--green2)' : d === step ? 'var(--green)' : 'var(--bg4)',
              flex: d === step ? 2 : 1,
            }} />
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 18, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {t('register_step', { step, total: TOTAL_STEPS })} · {Array.isArray(stepNames) ? stepNames[step - 1] : ''}
        </div>

        {error && <div className="alert alert-r" style={{ marginBottom: 16 }}><span className="alert-ico">⚠️</span><div>{error}</div></div>}

        {step === 1 && (
          <form onSubmit={nextStep}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{t('register_title')}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>{t('register_subtitle')}</div>
            <div className="field"><label>{t('register_name')}</label><input name="nombre" placeholder="Franklin López" value={form.nombre} onChange={handle} required /></div>
            <div className="field"><label>{t('register_email')}</label><input type="email" name="email" placeholder="tu@correo.com" value={form.email} onChange={handle} required /></div>
            <div className="field">
              <label>{t('register_password')}</label>
              <input type="password" name="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={handle} required minLength={6} />
              <PwdStrength pwd={form.password} t={t} />
            </div>
            <button className="auth-btn" type="submit">{t('register_continue')}</button>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 16 }}>
              {t('register_has_account')}{' '}
              <span style={{ color: 'var(--green2)', cursor: 'pointer', fontWeight: 500 }} onClick={() => nav('/login')}>{t('register_login')}</span>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={nextStep}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{t('register_income_title')}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>{t('register_income_sub')}</div>
            <div className="field">
              <label>{t('perfil_income')}</label>
              <input type="number" name="ingreso_mensual" placeholder="45000" value={form.ingreso_mensual} onChange={handle} style={{ fontSize: 22, fontFamily: 'var(--mono)', fontWeight: 700 }} />
            </div>
            <div className="alert alert-g" style={{ marginBottom: 16 }}>
              <span className="alert-ico">💡</span>
              <div style={{ fontSize: 12 }}>{t('register_income_tip')}</div>
            </div>
            <button className="auth-btn" type="submit">{t('register_continue')}</button>
            <button className="btn btn-o" type="button" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => setStep(3)}>{t('register_skip')}</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={nextStep}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{t('register_cobro_title')}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>{t('register_cobro_sub')}</div>
            <div className="field">
              <label>{t('register_freq')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['mensual', 'quincenal', 'semanal'].map(f => (
                  <div key={f} onClick={() => setForm({ ...form, frecuencia_cobro: f, dia_cobro: '' })}
                    style={{
                      flex: 1, textAlign: 'center', padding: '12px 6px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${form.frecuencia_cobro === f ? 'var(--green)' : 'var(--border2)'}`,
                      background: form.frecuencia_cobro === f ? 'rgba(29,158,117,.15)' : 'var(--bg3)',
                      color: form.frecuencia_cobro === f ? 'var(--green2)' : 'var(--text2)',
                      fontWeight: 700, fontSize: 12, transition: 'all .2s',
                    }}>
                    {f === 'mensual' ? t('register_mensual') : f === 'quincenal' ? t('register_quincenal') : t('register_semanal')}
                    <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2, opacity: .7 }}>
                      {f === 'mensual' ? t('register_mensual_sub') : f === 'quincenal' ? t('register_quincenal_sub') : t('register_semanal_sub')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {form.frecuencia_cobro === 'semanal' && (
              <div className="field">
                <label>{t('register_day_week')}</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(t('register_week_days') || ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']).map((name, i) => (
                    <div key={i} onClick={() => setForm({ ...form, dia_cobro: String(i + 1) })}
                      style={{
                        flex: 1, height: 44, borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 11, fontWeight: 700,
                        border: `2px solid ${form.dia_cobro === String(i + 1) ? 'var(--green)' : 'var(--border2)'}`,
                        background: form.dia_cobro === String(i + 1) ? 'rgba(29,158,117,.2)' : 'var(--bg3)',
                        color: form.dia_cobro === String(i + 1) ? 'var(--green2)' : 'var(--text2)',
                        transition: 'all .15s',
                      }}>
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(form.frecuencia_cobro === 'mensual' || form.frecuencia_cobro === 'quincenal') && (
              <div className="field">
                <label>{form.frecuencia_cobro === 'quincenal' ? t('register_day_bi') : t('register_day_mo')}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {diasOpciones.map(d => (
                    <div key={d} onClick={() => setForm({ ...form, dia_cobro: String(d) })}
                      style={{
                        width: 40, height: 40, borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 13, fontWeight: 700,
                        border: `2px solid ${form.dia_cobro === String(d) ? 'var(--green)' : 'var(--border2)'}`,
                        background: form.dia_cobro === String(d) ? 'rgba(29,158,117,.2)' : 'var(--bg3)',
                        color: form.dia_cobro === String(d) ? 'var(--green2)' : 'var(--text2)',
                        transition: 'all .15s',
                      }}>
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button className="auth-btn" type="submit" style={{ marginTop: 16 }}>{t('register_continue')}</button>
            <button className="btn btn-o" type="button" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => setStep(4)}>{t('register_skip')}</button>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={submit}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{t('register_final_title')}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>{t('register_final_sub')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[t('register_has_debts'), t('register_no_debts')].map((opt) => (
                <div key={opt} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{opt}</div>
                </div>
              ))}
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? t('register_creating') : t('register_start')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
