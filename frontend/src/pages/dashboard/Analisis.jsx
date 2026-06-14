import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { LibFull } from '../../components/LibSVG';
import { useToast, ToastContainer } from '../../components/Toast';
import {
  FileText, UploadCloud, Sparkles, AlertTriangle,
  RefreshCw, Lock, ScanText, TrendingUp, TrendingDown, Minus,
  CalendarDays, CheckCircle2, Zap, ShieldCheck,
  History, Trash2, ChevronRight, Check, GitCompare,
} from 'lucide-react';

const BAR_COLORS = [
  'var(--green2)', '#5ba4e0', '#efac27', '#e05252',
  '#a78bfa', '#34d399', '#fb923c',
];

export default function Analisis() {
  const { user, updateUser } = useAuth();
  const { t } = useLang();
  const { toasts, dismiss, toast } = useToast();

  const [file, setFile]               = useState(null);
  const [dragging, setDrag]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [paying, setPaying]           = useState(false);
  const [error, setError]             = useState('');
  const [result, setResult]           = useState(null);
  const [justPaid, setJustPaid]       = useState(false);
  const [historial, setHistorial]       = useState([]);
  const [viewingItem, setViewingItem]   = useState(null);
  const [compareMode, setCompareMode]   = useState(false);
  const [selectedIds, setSelectedIds]   = useState([]);
  const [comparing, setComparing]       = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const inputRef                        = useRef();

  const loadHistorial = useCallback(() => {
    api.get('analysis/history').then(({ data }) => setHistorial(data)).catch(() => {});
  }, []);

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
      toast.error(err.response?.data?.message || 'Error al iniciar el pago. Intenta de nuevo.');
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
      loadHistorial();
      toast.success('Análisis completado y guardado en el historial.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al analizar el PDF.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); setError(''); };

  const isPro = !!user?.analysis_pro;

  // Cargar historial cuando el usuario es Pro
  useEffect(() => {
    if (isPro) loadHistorial();
  }, [isPro, loadHistorial]);

  const handleDeleteHistorial = async (id) => {
    if (!window.confirm(t('historial_confirm_delete'))) return;
    try {
      await api.delete(`analysis/history/${id}`);
      setHistorial((prev) => prev.filter((h) => h.id !== id));
      if (viewingItem?.id === id) setViewingItem(null);
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      toast.success(t('historial_delete') + ' exitoso.');
    } catch {
      toast.error('Error al eliminar el análisis.');
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleCompare = async () => {
    setComparing(true);
    try {
      const { data } = await api.post('analysis/compare', { ids: selectedIds });
      setCompareMode(false);
      setSelectedIds([]);
      setCompareResult(data); // se setea DESPUÉS de limpiar el modo, sin borrar el resultado
      toast.success('Comparación completada.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al comparar. Intenta de nuevo.');
    } finally {
      setComparing(false);
    }
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setSelectedIds([]);
    setCompareResult(null);
  };

  const showingResult = result || viewingItem;

  return (
    <div className="view">
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      <div className="topbar">
        <div>
          <div className="page-title">{t('analisis_title')}</div>
          <div className="page-sub">{t('analisis_sub')}</div>
        </div>
        {(showingResult || compareResult) && (
          <button className="btn btn-ghost" onClick={() => { reset(); setViewingItem(null); exitCompareMode(); }}>
            {viewingItem || compareResult ? t('historial_back') : (
              <><RefreshCw size={15} style={{ marginRight: 6 }} />{t('analisis_new')}</>
            )}
          </button>
        )}
      </div>

      {/* Paywall — aparece si no es Pro */}
      {!isPro && <ProModal t={t} paying={paying} onPay={handlePay} justPaid={justPaid} />}

      {isPro && (loading || comparing) && <LoadingAnalysis t={t} comparing={comparing} />}

      {/* Resultado de comparación */}
      {isPro && !loading && !comparing && compareResult && (
        <ComparisonResult result={compareResult} t={t} />
      )}

      {/* Resultado en vivo o desde historial */}
      {isPro && !loading && !comparing && !compareResult && showingResult && (
        <Results result={viewingItem || result} t={t} />
      )}

      {isPro && !result && !viewingItem && !compareResult && !loading && !comparing && (
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

      {/* Historial */}
      {isPro && !result && !viewingItem && !compareResult && !loading && !comparing && (
        <HistorialSection
          historial={historial}
          t={t}
          onView={setViewingItem}
          onDelete={handleDeleteHistorial}
          compareMode={compareMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelectItem}
          onToggleMode={() => { setCompareMode(m => !m); setSelectedIds([]); }}
          onCompare={handleCompare}
          comparing={comparing}
        />
      )}
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

function LoadingAnalysis({ t, comparing }) {
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState([]);

  const steps = comparing
    ? [
        { Icon: GitCompare, label: t('comparar_periodo') + ' 1 vs 2…' },
        { Icon: TrendingUp, label: t('analisis_step_thinking') },
        { Icon: Sparkles,   label: t('analisis_step_writing') },
      ]
    : [
        { Icon: ScanText,   label: t('analisis_step_reading') },
        { Icon: TrendingUp, label: t('analisis_step_thinking') },
        { Icon: Sparkles,   label: t('analisis_step_writing') },
      ];

  useEffect(() => {
    const advance = (i) => {
      if (i >= steps.length - 1) return;
      const delay = i === 0 ? 2800 : 3500;
      setTimeout(() => {
        setDone(prev => [...prev, i]);
        setActiveStep(i + 1);
        advance(i + 1);
      }, delay);
    };
    advance(0);
  }, []);

  return (
    <div className="card slide-up" style={{ textAlign: 'center', padding: '44px 24px', overflow: 'hidden', position: 'relative' }}>
      {/* Glow de fondo */}
      <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,158,117,.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Lib flotando con glow */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, position: 'relative' }}>
        <div className="float-anim glow-green" style={{ borderRadius: '50%', padding: 8 }}>
          <LibFull size={76} />
        </div>
        {/* Anillo giratorio */}
        <div style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: 'var(--green2)',
          borderRightColor: 'rgba(29,158,117,.3)',
          animation: 'spinRing 2s linear infinite',
        }} />
      </div>

      <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text1)', marginBottom: 6 }}>
        {comparing ? t('comparar_analizando') : t('analisis_analyzing')}
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 28 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--green2)',
            animation: `dotScale 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280, margin: '0 auto' }}>
        {steps.map(({ Icon, label }, i) => {
          const isDone   = done.includes(i);
          const isActive = activeStep === i;
          const isPending = !isDone && !isActive;
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', borderRadius: 11,
                background: isDone   ? 'rgba(29,158,117,.1)'
                          : isActive ? 'rgba(29,158,117,.07)'
                          : 'var(--bg2)',
                border: `1px solid ${isDone || isActive ? 'rgba(29,158,117,.3)' : 'var(--border)'}`,
                color: isPending ? 'var(--text4)' : 'var(--text2)',
                fontSize: 13,
                transition: 'all .4s cubic-bezier(.4,0,.2,1)',
                animation: isActive ? 'stepIn .35s ease both' : 'none',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {isDone ? (
                <CheckCircle2 size={15} style={{ color: 'var(--green2)', flexShrink: 0 }} />
              ) : isActive ? (
                <div style={{ width: 15, height: 15, flexShrink: 0, border: '2px solid var(--green2)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spinRing .8s linear infinite' }} />
              ) : (
                <Icon size={15} style={{ color: 'var(--text4)', flexShrink: 0 }} />
              )}
              <span style={{ fontWeight: isActive ? 600 : 400 }}>{label}</span>
              {isActive && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                  {[0,1,2].map(d => (
                    <div key={d} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--green2)', animation: `dotScale 1s ease-in-out ${d * 0.15}s infinite` }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra de progreso falsa */}
      <div style={{ maxWidth: 280, margin: '20px auto 0', height: 3, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--green), var(--green2))',
          width: `${((activeStep + 1) / steps.length) * 100}%`,
          transition: 'width 1s cubic-bezier(.4,0,.2,1)',
          boxShadow: '0 0 8px rgba(29,158,117,.6)',
        }} />
      </div>
    </div>
  );
}

function HistorialSection({ historial, t, onView, onDelete, compareMode, selectedIds, onToggleSelect, onToggleMode, onCompare, comparing }) {
  if (historial.length === 0) return null;

  const canCompare = selectedIds.length >= 2;

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: compareMode ? 8 : 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={16} style={{ color: 'var(--green2)' }} />
          <div className="sec-label">{t('historial_title')}</div>
        </div>
        {historial.length >= 2 && (
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={onToggleMode}
          >
            {compareMode ? t('comparar_cancelar') : (
              <><GitCompare size={13} />{t('comparar_modo')}</>
            )}
          </button>
        )}
      </div>

      {compareMode && (
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, padding: '8px 12px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          {t('comparar_selecting')} <strong style={{ color: 'var(--text1)' }}>({selectedIds.length}/3)</strong>
        </div>
      )}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {historial.map((item, i) => {
          const isSelected = selectedIds.includes(item.id);
          const isDisabled = compareMode && selectedIds.length >= 3 && !isSelected;
          const label = new Date(item.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
          const resumenCorto = item.resumen?.length > 75 ? item.resumen.slice(0, 75) + '…' : item.resumen;

          return (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0',
                borderBottom: i < historial.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: isDisabled ? 0.35 : 1,
                transition: 'opacity .2s',
              }}
            >
              {/* Checkbox en modo comparar */}
              {compareMode && (
                <div
                  onClick={() => !isDisabled && onToggleSelect(item.id)}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${isSelected ? 'var(--green2)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--green2)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: isDisabled ? 'default' : 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  {isSelected && <Check size={13} color="#000" />}
                </div>
              )}

              {/* Icono */}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: isSelected ? 'rgba(29,158,117,.2)' : 'rgba(29,158,117,.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .15s',
              }}>
                <FileText size={15} style={{ color: 'var(--green2)' }} />
              </div>

              {/* Info */}
              <div
                style={{ flex: 1, minWidth: 0, cursor: compareMode ? (isDisabled ? 'default' : 'pointer') : 'pointer' }}
                onClick={() => compareMode ? (!isDisabled && onToggleSelect(item.id)) : onView(item)}
              >
                <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 2 }}>
                  {label}{item.filename ? ` · ${item.filename}` : ''}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {resumenCorto}
                </div>
              </div>

              {/* Acciones (solo fuera de modo comparar) */}
              {!compareMode && (
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button className="btn btn-ghost" style={{ padding: '6px 8px', minWidth: 0 }} onClick={() => onView(item)}>
                    <ChevronRight size={15} />
                  </button>
                  <button className="btn btn-ghost" style={{ padding: '6px 8px', minWidth: 0, color: 'var(--red)' }} onClick={() => onDelete(item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón comparar */}
      {compareMode && (
        <button
          className="btn btn-p"
          style={{ width: '100%', marginTop: 16, opacity: canCompare ? 1 : 0.45 }}
          onClick={onCompare}
          disabled={!canCompare || comparing}
        >
          <GitCompare size={15} style={{ marginRight: 8 }} />
          {comparing ? t('comparar_analizando') : `${t('comparar_btn')} (${selectedIds.length})`}
        </button>
      )}
    </div>
  );
}

function ComparisonResult({ result, t }) {
  const { tendencia, resumen, items = [], same_document } = result;
  const cambios_categorias = parseJsonField(result.cambios_categorias);
  const recomendaciones    = parseJsonField(result.recomendaciones);

  // Caso especial: mismo documento
  if (same_document) {
    return (
      <>
        <div className="card" style={{ marginBottom: 12, textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔁</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text1)', marginBottom: 8 }}>
            Mismo estado de cuenta
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: '0 0 16px' }}>{resumen}</p>
          {items.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              {items.map((it, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--text4)', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px' }}>
                  {new Date(it.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                  {it.filename ? ` · ${it.filename}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <LibFull size={20} />
            <div className="sec-label">{t('comparar_recs')}</div>
          </div>
          {recomendaciones.map((rec, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '11px 0', borderBottom: i < recomendaciones.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: 'rgba(29,158,117,.12)', color: 'var(--green2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
              <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>{rec}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  const cfg = {
    mejora:     { label: t('comparar_tendencia_mejora'),    color: 'var(--green2)', bg: 'rgba(29,158,117,.12)', border: 'rgba(29,158,117,.3)', Icon: TrendingUp },
    deterioro:  { label: t('comparar_tendencia_deterioro'), color: 'var(--red)',    bg: 'rgba(224,82,82,.1)',   border: 'rgba(224,82,82,.3)',   Icon: TrendingDown },
    estable:    { label: t('comparar_tendencia_estable'),   color: '#5ba4e0',       bg: 'rgba(91,164,224,.1)', border: 'rgba(91,164,224,.3)', Icon: Minus },
  }[tendencia] || { label: tendencia, color: 'var(--text2)', bg: 'var(--bg2)', border: 'var(--border)', Icon: Minus };

  const { Icon } = cfg;

  return (
    <>
      {/* Hero tendencia */}
      <div className="card scale-in" style={{ marginBottom: 12, textAlign: 'center', border: `1px solid ${cfg.border}`, background: `${cfg.bg}` }}>
        {/* Badge animado con bounce */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 99, padding: '10px 22px',
            animation: 'bounceIn .55s cubic-bezier(.4,0,.2,1) both',
          }}>
            <Icon size={20} style={{ color: cfg.color }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: cfg.color, letterSpacing: '-.02em' }}>{cfg.label}</span>
          </div>
        </div>
        <p className="slide-up" style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, margin: '0 0 16px', animationDelay: '.1s' }}>{resumen}</p>
        {items.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {items.map((it, i) => (
              <div key={i} style={{
                fontSize: 11, color: 'var(--text4)', background: 'var(--bg)',
                border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px',
                animation: `slideUp .3s ease ${0.15 + i * 0.08}s both`,
              }}>
                {t('comparar_periodo')} {i + 1} · {new Date(it.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                {it.filename ? ` · ${it.filename}` : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cambios por categoría */}
      {cambios_categorias.length > 0 && (
        <div className="card slide-up" style={{ marginBottom: 12, animationDelay: '.12s' }}>
          <div className="sec-label" style={{ marginBottom: 14 }}>{t('comparar_cambios')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {cambios_categorias.map((cat, i) => {
              const isGood = cat.cambio_pct <= 0;
              const changeColor = isGood ? 'var(--green2)' : 'var(--red)';
              const arrow = cat.cambio_pct > 0 ? '↑' : cat.cambio_pct < 0 ? '↓' : '→';
              const barBefore = 100;
              const barAfter  = cat.antes > 0 ? Math.min(100, (cat.despues / cat.antes) * 100) : 0;
              return (
                <div key={i} style={{
                  padding: '12px 0',
                  borderBottom: i < cambios_categorias.length - 1 ? '1px solid var(--border)' : 'none',
                  animation: `slideUp .35s cubic-bezier(.4,0,.2,1) ${0.16 + i * 0.06}s both`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{cat.emoji}</span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text1)', fontWeight: 500 }}>{cat.nombre}</span>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 2 }}>
                        {Number(cat.antes).toLocaleString()} → {Number(cat.despues).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: changeColor }}>
                        {arrow} {Math.abs(cat.cambio_pct)}%
                      </div>
                    </div>
                  </div>
                  {/* Mini barra antes/después */}
                  <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--bg3)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '100%', background: 'var(--border2)', borderRadius: 99 }} />
                    </div>
                    <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--bg3)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barAfter}%`, background: changeColor, borderRadius: 99, transition: `width 1s cubic-bezier(.4,0,.2,1) ${0.3 + i * 0.06}s`, boxShadow: `0 0 6px ${changeColor}88` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {recomendaciones.length > 0 && (
        <div className="card slide-up" style={{ animationDelay: '.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <LibFull size={20} />
            <div className="sec-label">{t('comparar_recs')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recomendaciones.map((rec, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '12px 0',
                borderBottom: i < recomendaciones.length - 1 ? '1px solid var(--border)' : 'none',
                animation: `slideUp .35s ease ${0.25 + i * 0.07}s both`,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                  background: 'rgba(29,158,117,.12)', color: 'var(--green2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function parseJsonField(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return fallback;
}

function Results({ result, t }) {
  const { resumen, alerta } = result;
  const categorias      = parseJsonField(result.categorias);
  const recomendaciones = parseJsonField(result.recomendaciones);
  const totalGasto      = categorias.reduce((s, c) => s + Number(c.total), 0);
  const [barsVisible, setBarsVisible] = useState(false);
  useEffect(() => { const id = setTimeout(() => setBarsVisible(true), 120); return () => clearTimeout(id); }, []);

  return (
    <>
      {/* Alert */}
      {alerta && (
        <div className="card slide-up" style={{ marginBottom: 12, borderLeft: '3px solid var(--amber)', background: 'rgba(239,159,39,.06)', animationDelay: '0s' }}>
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
      <div className="card hero-blue slide-up" style={{ marginBottom: 12, animationDelay: alerta ? '.08s' : '0s' }}>
        <div className="hero-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <LibFull size={18} />
          {t('analisis_resumen_title')}
        </div>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, margin: '8px 0 0' }}>{resumen}</p>
      </div>

      {/* Categories */}
      {categorias.length > 0 && (
        <div className="card slide-up" style={{ marginBottom: 12, animationDelay: '.14s' }}>
          <div className="sec-label" style={{ marginBottom: 16 }}>{t('analisis_cats_title')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {categorias.map((cat, i) => {
              const color = BAR_COLORS[i % BAR_COLORS.length];
              const pct = totalGasto > 0 ? Math.round((Number(cat.total) / totalGasto) * 100) : cat.porcentaje;
              return (
                <div key={cat.nombre} style={{ animation: `slideUp .35s cubic-bezier(.4,0,.2,1) ${0.18 + i * 0.06}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                        background: `${color}22`, border: `1px solid ${color}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, transition: 'transform .2s',
                      }}>
                        {cat.emoji}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text1)' }}>{cat.nombre}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', animation: `slideUp .3s ease ${0.2 + i * 0.06}s both` }}>
                        {Number(cat.total).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color, fontWeight: 600 }}>{pct}%</div>
                    </div>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, background: 'var(--bg3)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: barsVisible ? `${pct}%` : '0%',
                      background: `linear-gradient(90deg, ${color}cc, ${color})`,
                      borderRadius: 99,
                      transition: `width 1s cubic-bezier(.4,0,.2,1) ${0.25 + i * 0.08}s`,
                      boxShadow: `0 0 8px ${color}66`,
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
        <div className="card slide-up" style={{ animationDelay: '.22s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <LibFull size={22} />
            <div className="sec-label">{t('analisis_recs_title')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recomendaciones.map((rec, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '14px 0',
                borderBottom: i < recomendaciones.length - 1 ? '1px solid var(--border)' : 'none',
                animation: `slideUp .35s cubic-bezier(.4,0,.2,1) ${0.28 + i * 0.07}s both`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                  background: 'rgba(29,158,117,.12)', color: 'var(--green2)',
                  border: '1px solid rgba(29,158,117,.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  animation: `popIn .4s cubic-bezier(.4,0,.2,1) ${0.3 + i * 0.07}s both`,
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)', marginBottom: 3 }}>{rec.titulo}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>{rec.detalle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
