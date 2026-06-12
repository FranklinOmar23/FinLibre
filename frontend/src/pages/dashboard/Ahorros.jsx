import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useLang } from '../../context/LangContext';
import { calcDeducciones } from '../../utils/deducciones';
import ModalAhorro from '../../components/ModalAhorro';
import ModalMeta from '../../components/ModalMeta';
import {
  PiggyBank, Target, Plane, Car, GraduationCap, Home,
  ShieldCheck, Monitor, Plus, Check, AlertTriangle, Wallet,
} from 'lucide-react';

const CAT_ICON = {
  'Viaje': Plane, 'Vehículo': Car, 'Educación': GraduationCap,
  'Vivienda': Home, 'Emergencia': ShieldCheck, 'Tecnología': Monitor, 'Otro': Target,
};

export default function Ahorros() {
  const { user } = useAuth();
  const { savings, goals, removeSaving, removeGoal, abonarSaving, abonarGoal, totalServicios, totalCuotas } = useFinance();
  const { t, fmt, months, idioma } = useLang();

  const [showModalAhorro, setShowModalAhorro] = useState(false);
  const [showModalMeta,   setShowModalMeta]   = useState(false);
  const [editAhorro, setEditAhorro] = useState(null);
  const [editMeta,   setEditMeta]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [abonarTarget, setAbonarTarget] = useState(null);
  const [abonarMonto,  setAbonarMonto]  = useState('');
  const [abonarLoading, setAbonarLoading] = useState(false);

  const ingreso = parseFloat(user?.ingreso_mensual || 0);
  const { neto } = calcDeducciones(ingreso, user?.regimen || 'RD_FORMAL', parseFloat(user?.deduccion_pct || 0));
  const totalMetasMes = goals.reduce((sum, g) => sum + parseFloat(g.ahorro_mensual || 0), 0);
  const libre = neto - totalServicios - totalCuotas;
  const libreTrasMetas = libre - totalMetasMes;

  const totalGuardado =
    savings.reduce((s, x) => s + parseFloat(x.monto_actual || 0), 0) +
    goals.reduce((s, x) => s + parseFloat(x.monto_actual || 0), 0);
  const totalObjetivos =
    savings.reduce((s, x) => s + parseFloat(x.monto_objetivo || 0), 0) +
    goals.reduce((s, x) => s + parseFloat(x.monto_objetivo || 0), 0);

  const openAbonar = (type, item) => {
    setAbonarTarget({ type, id: item.id, nombre: item.nombre, actual: parseFloat(item.monto_actual), objetivo: parseFloat(item.monto_objetivo) });
    setAbonarMonto('');
  };

  const handleAbonar = async () => {
    if (!abonarTarget || !abonarMonto || parseFloat(abonarMonto) <= 0) return;
    setAbonarLoading(true);
    try {
      if (abonarTarget.type === 'ahorro') await abonarSaving(abonarTarget.id, parseFloat(abonarMonto));
      else await abonarGoal(abonarTarget.id, parseFloat(abonarMonto));
      setAbonarTarget(null); setAbonarMonto('');
    } finally { setAbonarLoading(false); }
  };

  const handleConfirmDel = async () => {
    if (!confirmDel) return;
    if (confirmDel.type === 'ahorro') await removeSaving(confirmDel.id);
    else await removeGoal(confirmDel.id);
    setConfirmDel(null);
  };

  const fmtFecha = (meses) => {
    const d = new Date(); d.setMonth(d.getMonth() + meses);
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div className="view">
      <div className="topbar">
        <div>
          <div className="page-title">{t('ahorros_title')}</div>
          <div className="page-sub">{t('ahorros_sub')}</div>
        </div>
      </div>

      <div className="card hero-green" style={{ marginBottom: 18 }}>
        <div className="hero-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PiggyBank size={13} /> {t('ahorros_total_saved')}
        </div>
        <div className="hero-val">{fmt(totalGuardado)}</div>
        <div className="hero-sub">{t('ahorros_of_goals', { amount: fmt(totalObjetivos), n: savings.length + goals.length })}</div>
      </div>

      {/* Alcancías */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="sec-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <PiggyBank size={14} /> {t('ahorros_piggy')}
          </div>
          <button className="btn btn-p" style={{ fontSize: 11, padding: '5px 12px', gap: 5 }} onClick={() => { setEditAhorro(null); setShowModalAhorro(true); }}>
            <Plus size={13} /> {t('btn_new')}
          </button>
        </div>

        {savings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)' }}>
            <PiggyBank size={38} style={{ opacity: 0.2, margin: '0 auto 8px', display: 'block' }} />
            <div style={{ fontSize: 13 }}>{t('ahorros_piggy_empty')}</div>
          </div>
        )}

        {savings.map((s) => {
          const pct = parseFloat(s.monto_objetivo) > 0
            ? Math.min(100, Math.round((parseFloat(s.monto_actual) / parseFloat(s.monto_objetivo)) * 100)) : 0;
          const done = pct >= 100;
          return (
            <div className="row" key={s.id} style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="row-ico" style={{ background: done ? 'rgba(29,158,117,.15)' : 'rgba(239,159,39,.12)' }}>
                      <PiggyBank size={18} style={{ color: done ? 'var(--green2)' : 'var(--amber)' }} />
                    </div>
                    <div>
                      <div className="row-name">{s.nombre}</div>
                      <div className="row-sub">{fmt(s.monto_actual)} / {fmt(s.monto_objetivo)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="row-amt" style={{ color: done ? 'var(--green2)' : 'var(--amber)' }}>{pct}%</div>
                    {done && <span className="chip chip-g" style={{ fontSize: 9, marginTop: 3 }}><Check size={9} /> {t('ahorros_achieved_chip')}</span>}
                  </div>
                </div>
                <div className="pbar-bg">
                  <div className="pbar-fill" style={{ width: `${pct}%`, background: done ? 'var(--green)' : 'var(--amber)' }} />
                </div>
                <div className="pbar-labels">
                  <span>{t('ahorros_saved', { amount: fmt(s.monto_actual) })}</span>
                  <span>{t('ahorros_remaining', { amount: fmt(parseFloat(s.monto_objetivo) - parseFloat(s.monto_actual)) })}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {!done && <button className="btn btn-p" style={{ fontSize: 11, padding: '5px 12px', gap: 5 }} onClick={() => openAbonar('ahorro', s)}><Plus size={13} /> {t('btn_deposit')}</button>}
                  <button className="btn btn-o" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => { setEditAhorro(s); setShowModalAhorro(true); }}>{t('btn_edit')}</button>
                  <button className="btn btn-r" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => setConfirmDel({ type: 'ahorro', id: s.id })}>{t('btn_delete')}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Metas con plan */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="sec-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={14} /> {t('ahorros_goals')}
          </div>
          <button className="btn btn-p" style={{ fontSize: 11, padding: '5px 12px', gap: 5 }} onClick={() => { setEditMeta(null); setShowModalMeta(true); }}>
            <Plus size={13} /> {t('btn_new')}
          </button>
        </div>

        {goals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)' }}>
            <Target size={38} style={{ opacity: 0.2, margin: '0 auto 8px', display: 'block' }} />
            <div style={{ fontSize: 13 }}>{t('ahorros_goals_empty')}</div>
          </div>
        )}

        {goals.map((g) => {
          const pct = parseFloat(g.monto_objetivo) > 0
            ? Math.min(100, Math.round((parseFloat(g.monto_actual) / parseFloat(g.monto_objetivo)) * 100)) : 0;
          const restante = Math.max(0, parseFloat(g.monto_objetivo) - parseFloat(g.monto_actual));
          const mesesRestantes = parseFloat(g.ahorro_mensual) > 0 ? Math.ceil(restante / parseFloat(g.ahorro_mensual)) : null;
          const done = pct >= 100;
          const CatIcon = CAT_ICON[g.categoria] || Target;

          let fechaStr = '';
          if (g.fecha_objetivo) {
            const fd = new Date(g.fecha_objetivo + 'T00:00:00');
            fechaStr = `${months[fd.getMonth()]} ${fd.getFullYear()}`;
          } else if (mesesRestantes) {
            fechaStr = fmtFecha(mesesRestantes);
          }

          return (
            <div className="row" key={g.id} style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="row-ico" style={{ background: done ? 'rgba(29,158,117,.15)' : 'rgba(99,130,248,.12)' }}>
                      <CatIcon size={18} style={{ color: done ? 'var(--green2)' : 'var(--blue)' }} />
                    </div>
                    <div>
                      <div className="row-name">{g.nombre}</div>
                      <div className="row-sub">{fmt(g.ahorro_mensual)}/mes{fechaStr && ` · ${fechaStr}`}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="row-amt" style={{ color: done ? 'var(--green2)' : 'var(--blue)' }}>{fmt(g.monto_actual)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text4)' }}>{idioma === 'en' ? 'of' : 'de'} {fmt(g.monto_objetivo)}</div>
                  </div>
                </div>
                <div className="pbar-bg">
                  <div className="pbar-fill" style={{ width: `${pct}%`, background: done ? 'var(--green)' : 'var(--blue)' }} />
                </div>
                <div className="pbar-labels">
                  <span>{t('ahorros_pct_done', { n: pct })}</span>
                  {!done && mesesRestantes && <span>{t('ahorros_months_left', { n: mesesRestantes })}</span>}
                  {done && <span style={{ color: 'var(--green2)' }}>{t('ahorros_completed')}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {!done && <button className="btn btn-p" style={{ fontSize: 11, padding: '5px 12px', gap: 5 }} onClick={() => openAbonar('meta', g)}><Plus size={13} /> {t('btn_deposit')}</button>}
                  <button className="btn btn-o" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => { setEditMeta(g); setShowModalMeta(true); }}>{t('btn_edit')}</button>
                  <button className="btn btn-r" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => setConfirmDel({ type: 'meta', id: g.id })}>{t('btn_delete')}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {goals.length > 0 && ingreso > 0 && (
        <div className={`alert ${libreTrasMetas < 0 ? 'alert-r' : libreTrasMetas < neto * 0.1 ? 'alert-a' : 'alert-g'}`}>
          <span className="alert-ico">{libreTrasMetas < 0 ? <AlertTriangle size={16} /> : <Wallet size={16} />}</span>
          <div style={{ fontSize: 12 }}>
            <span dangerouslySetInnerHTML={{ __html: t('ahorros_commit', { amount: fmt(totalMetasMes) }) }} />
            {' '}
            {libreTrasMetas >= 0
              ? <span dangerouslySetInnerHTML={{ __html: t('ahorros_left', { amount: fmt(libreTrasMetas) }) }} />
              : <span dangerouslySetInnerHTML={{ __html: t('ahorros_over', { amount: fmt(Math.abs(libreTrasMetas)) }) }} />}
          </div>
        </div>
      )}

      {showModalAhorro && <ModalAhorro ahorro={editAhorro} onClose={() => { setShowModalAhorro(false); setEditAhorro(null); }} />}
      {showModalMeta && <ModalMeta meta={editMeta} onClose={() => { setShowModalMeta(false); setEditMeta(null); }} />}

      {confirmDel && (
        <div className="overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" style={{ maxWidth: 320 }} onClick={(e) => e.stopPropagation()}>
            <h3>{t('confirm_delete_title')}</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', margin: '12px 0' }}>{t('confirm_delete_sub')}</p>
            <div className="modal-actions">
              <button className="btn btn-r" style={{ flex: 1 }} onClick={handleConfirmDel}>{t('yes_delete')}</button>
              <button className="btn btn-o" style={{ flex: 1 }} onClick={() => setConfirmDel(null)}>{t('btn_cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {abonarTarget && (
        <div className="overlay" onClick={() => setAbonarTarget(null)}>
          <div className="modal" style={{ maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
            <h3><Plus size={18} /> {t('ahorros_deposit_to', { name: abonarTarget.nombre })}</h3>
            <div style={{ marginBottom: 14, color: 'var(--text3)', fontSize: 13 }}>
              {t('ahorros_you_have', { actual: fmt(abonarTarget.actual), objetivo: fmt(abonarTarget.objetivo) })}
            </div>
            <div className="field">
              <label>{t('ahorros_how_much')}</label>
              <input type="number" autoFocus value={abonarMonto} onChange={(e) => setAbonarMonto(e.target.value)} placeholder="0" />
              {parseFloat(abonarMonto) > 0 && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--green2)', background: 'var(--gLight)', padding: '6px 10px', borderRadius: 8 }}>
                  {t('ahorros_new_total', { amount: fmt(Math.min(abonarTarget.actual + parseFloat(abonarMonto), abonarTarget.objetivo)) })}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-p" style={{ flex: 1 }} onClick={handleAbonar} disabled={abonarLoading || !abonarMonto}>
                {abonarLoading ? t('saving') : t('btn_confirm')}
              </button>
              <button className="btn btn-o" style={{ flex: 1 }} onClick={() => setAbonarTarget(null)}>{t('btn_cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
