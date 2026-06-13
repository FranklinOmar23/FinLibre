import { useState, useRef, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { LibFull } from '../../components/LibSVG';
import {
  FileText, UploadCloud, Sparkles, AlertTriangle,
  RefreshCw, Lock, ScanText, TrendingUp, CalendarDays,
  CheckCircle2, Zap, ShieldCheck,
} from 'lucide-react';

const BAR_COLORS = [
  'var(--green2)', '#5ba4e0', '#efac27', '#e05252',
  '#a78bfa', '#34d399', '#fb923c',
];

export default function Analisis() {
  const { user, updateUser } = useAuth();
  const { t } = useLang();

  const [file, setFile]         = useState(null);
  const [dragging, setDrag]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [paying, setPaying]     = useState(false);
  const [error, setError]       = useState('');
  const [result, setResult]     = useState(null);
  const [justPaid, setJustPaid] = useState(false);
  const inputRef                = useRef();

  useEffect(() => {
    // Retorno exitoso de Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get('unlocked') === 'true') {
      setJustPaid(true);
      window.history.replaceState({}, '', '/app/analisis');
      api.get('auth/me').then((res) => updateUser(res.data.user)).catch(() => {});
    }

    // bfcache: si el usuario volvió con "atrás" desde Stripe sin pagar,
    // el browser restaura la página con paying=true congelado — lo reseteamos
    const handlePageShow = (e) => {
      if (e.persisted) setPaying(false);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const handlePay = async () => {
    setPaying(true);
    try {
      const { data } = await api.post('stripe/analysis-pro');
      window.location.href = data.url;
    } catch (err) {
      setPaying(false);
      alert(err.response?.data?.message || 'Error al iniciar el pago. Intenta de nuevo.');
    }
  };

  const validateFile = (f) => {
    if (!f) return '';
    if (f.type !== 'application/pdf') return t('analisis_error_type');
    if (f.size > 5 * 1024 * 1024) return t('analisis_error_size');
    return '';
  };

  const pickFile = (f) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError('');
    setFile(f);
    setResult(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('pdf', file);
      const { data } = await api.post('analysis', form, { timeout: 120000 });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al analizar el PDF.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); setError(''); };

  const isPro = !!user?.analysis_pro;

  return (
    <div className="view">
      <div className="topbar">
        <div>
          <div className="page-title">{t('analisis_title')}</div>
          <div className="page-sub">{t('analisis_sub')}</div>
        </div>
        {result && (
          <button className="btn btn-ghost" onClick={reset}>
            <RefreshCw size={15} style={{ marginRight: 6 }} />
            {t('analisis_new')}
          </button>
        )}
      </div>

      {/* Paywall — aparece si no es Pro */}
      {!isPro && <ProModal t={t} paying={paying} onPay={handlePay} justPaid={justPaid} />}

      {isPro && loading && <LoadingAnalysis t={t} />}

      {isPro && !result && !loading && (
        <div className="card" style={{ marginBottom: 16 }}>

          {/* 3-month tip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(29,158,117,.08)', border: '1px solid rgba(29,158,117,.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
          }}>
            <CalendarDays size={15} style={{ color: 'var(--green2)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>
              {t('analisis_months_tip')}
            </span>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging || file ? 'var(--green2)' : 'var(--border)'}`,
              borderRadius: 12,
              padding: '36px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(29,158,117,.07)' : file ? 'rgba(29,158,117,.04)' : 'var(--bg2)',
              transition: 'all .2s',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => pickFile(e.target.files[0])}
            />
            {file ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <FileText size={40} style={{ color: 'var(--green2)' }} />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text1)', marginBottom: 4 }}>{file.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                  {(file.size / 1024).toFixed(0)} KB · PDF
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <UploadCloud size={40} style={{ color: 'var(--text3)' }} />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text1)', marginBottom: 6 }}>
                  {t('analisis_drop_title')}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
                  {t('analisis_drop_sub')}
                </div>
                <button className="btn btn-ghost" style={{ pointerEvents: 'none' }}>
                  {t('analisis_btn_select')}
                </button>
              </>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text4)', textAlign: 'center', marginTop: 10 }}>
            {t('analisis_drop_limit')}
          </div>

          {error && (
            <div style={{ marginTop: 12, color: 'var(--red)', fontSize: 13, textAlign: 'center' }}>
              {error}
            </div>
          )}

          {file && (
            <button
              className="btn btn-p"
              style={{ width: '100%', marginTop: 16 }}
              onClick={analyze}
            >
              <Sparkles size={16} style={{ marginRight: 8 }} />
              {t('analisis_btn_analyze')}
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, color: 'var(--text4)', fontSize: 12 }}>
            <Lock size={12} />
            {t('analisis_privacy')}
          </div>
        </div>
      )}

      {isPro && !loading && result && <Results result={result} t={t} />}
    </div>
  );
}

function ProModal({ t, paying, onPay, justPaid }) {
  const features = [
    t('pro_feat_1'),
    t('pro_feat_2'),
    t('pro_feat_3'),
    t('pro_feat_4'),
  ];

  if (justPaid) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <LibFull size={64} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green2)', marginBottom: 8 }}>
          {t('pro_success_title')}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>
          {t('pro_success_desc')}
        </div>
        <button className="btn btn-ghost" onClick={() => window.location.reload()} style={{ width: '100%' }}>
          {t('pro_success_btn')}
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 16, overflow: 'hidden', position: 'relative' }}>
      {/* Header verde */}
      <div style={{
        background: 'linear-gradient(135deg, var(--green1) 0%, #0a4a36 100%)',
        margin: '-20px -20px 20px',
        padding: '28px 24px 22px',
        textAlign: 'center',
        borderRadius: '12px 12px 0 0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <LibFull size={60} />
            <div style={{
              position: 'absolute', bottom: -4, right: -8,
              background: 'var(--amber)', borderRadius: 99,
              padding: '2px 7px', fontSize: 11, fontWeight: 700, color: '#000',
            }}>
              PRO
            </div>
          </div>
        </div>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 4 }}>
          {t('pro_modal_title')}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>
          {t('pro_modal_sub')}
        </div>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <CheckCircle2 size={16} style={{ color: 'var(--green2)', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Price */}
      <div style={{
        background: 'var(--bg2)', borderRadius: 12, padding: '16px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, border: '1px solid var(--border)',
      }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 2 }}>{t('pro_price_label')}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text1)' }}>
            RD$300
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            background: 'rgba(29,158,117,.15)', color: 'var(--green2)',
            borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700,
          }}>
            {t('pro_price_once')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>
            {t('pro_price_forever')}
          </div>
        </div>
      </div>

      {/* Pay button */}
      <button
        className="btn btn-p"
        style={{ width: '100%', marginBottom: 12, fontSize: 15, padding: '13px' }}
        onClick={onPay}
        disabled={paying}
      >
        {paying ? (
          t('pro_paying')
        ) : (
          <>
            <Zap size={16} style={{ marginRight: 8 }} />
            {t('pro_pay_btn')}
          </>
        )}
      </button>

      {/* Security note */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text4)', fontSize: 12 }}>
        <ShieldCheck size={13} />
        {t('pro_secure')}
      </div>
    </div>
  );
}

function LoadingAnalysis({ t }) {
  const steps = [
    { Icon: ScanText,   label: t('analisis_step_reading') },
    { Icon: TrendingUp, label: t('analisis_step_thinking') },
    { Icon: Sparkles,   label: t('analisis_step_writing') },
  ];
  return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }} className="pulse-anim">
        <LibFull size={72} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text1)', marginBottom: 8 }}>
        {t('analisis_analyzing')}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 28, lineHeight: 1.6, maxWidth: 300, margin: '0 auto 28px' }}>
        {t('analisis_loading_desc')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 260, margin: '0 auto' }}>
        {steps.map(({ Icon, label }, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 10,
            background: 'var(--bg2)', border: '1px solid var(--border)',
            color: 'var(--text2)', fontSize: 13,
          }}>
            <Icon size={15} style={{ color: 'var(--green2)', flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function Results({ result, t }) {
  const { resumen, categorias = [], recomendaciones = [], alerta } = result;
  const totalGasto = categorias.reduce((s, c) => s + Number(c.total), 0);

  return (
    <>
      {/* Alert */}
      {alerta && (
        <div className="card" style={{ marginBottom: 12, borderLeft: '3px solid var(--amber)', background: 'rgba(239,159,39,.06)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={16} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--amber)', fontSize: 13, marginBottom: 3 }}>{t('analisis_alerta_title')}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{alerta}</div>
            </div>
          </div>
        </div>
      )}

      {/* Summary hero */}
      <div className="card hero-blue" style={{ marginBottom: 12 }}>
        <div className="hero-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <LibFull size={18} />
          {t('analisis_resumen_title')}
        </div>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, margin: '8px 0 0' }}>{resumen}</p>
      </div>

      {/* Categories */}
      {categorias.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="sec-label" style={{ marginBottom: 16 }}>{t('analisis_cats_title')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {categorias.map((cat, i) => {
              const color = BAR_COLORS[i % BAR_COLORS.length];
              const pct = totalGasto > 0 ? Math.round((Number(cat.total) / totalGasto) * 100) : cat.porcentaje;
              return (
                <div key={cat.nombre}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: `${color}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18,
                      }}>
                        {cat.emoji}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text1)' }}>{cat.nombre}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>
                        {Number(cat.total).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text4)' }}>{pct}%</div>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--bg3)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: color,
                      borderRadius: 99,
                      transition: 'width .7s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recomendaciones.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <LibFull size={22} />
            </div>
            <div className="sec-label">{t('analisis_recs_title')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recomendaciones.map((rec, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '14px 0',
                borderBottom: i < recomendaciones.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(29,158,117,.12)', color: 'var(--green2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)', marginBottom: 3 }}>
                    {rec.titulo}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>
                    {rec.detalle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
