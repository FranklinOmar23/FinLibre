import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useLang } from '../context/LangContext';
import { Target, Pencil, AlertCircle, CalendarDays, Wallet, AlertTriangle } from 'lucide-react';

const CATEGORIAS = [
  { label: 'Viaje',      key: 'cat_Viaje',      emoji: '✈️' },
  { label: 'Vehículo',   key: 'cat_Vehículo',   emoji: '🚗' },
  { label: 'Educación',  key: 'cat_Educación',  emoji: '🎓' },
  { label: 'Vivienda',   key: 'cat_Vivienda',   emoji: '🏠' },
  { label: 'Emergencia', key: 'cat_Emergencia', emoji: '🛡️' },
  { label: 'Tecnología', key: 'cat_Tecnología', emoji: '💻' },
  { label: 'Otro',       key: 'cat_Otro',       emoji: '🎯' },
];

export default function ModalMeta({ onClose, meta }) {
  const { user } = useAuth();
  const { addGoal, updateGoal, goals, totalServicios, totalCuotas } = useFinance();
  const { t, fmt, months } = useLang();
  const isEdit = !!meta;

  const [mode, setMode] = useState('por_plazo');
  const [form, setForm] = useState({
    nombre:         meta?.nombre         || '',
    categoria:      meta?.categoria      || 'Otro',
    monto_objetivo: meta?.monto_objetivo ? String(meta.monto_objetivo) : '',
    monto_actual:   meta?.monto_actual   ? String(meta.monto_actual)   : '0',
    meses:          '',
    ahorro_mensual: meta?.ahorro_mensual ? String(meta.ahorro_mensual) : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fechaMeta = (meses) => {
    if (!meses || meses <= 0) return '';
    const d = new Date();
    d.setMonth(d.getMonth() + meses);
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const restante = Math.max(0, parseFloat(form.monto_objetivo || 0) - parseFloat(form.monto_actual || 0));

  const ahorroCalc = (mode === 'por_plazo' && parseInt(form.meses) > 0 && restante > 0)
    ? Math.ceil(restante / parseInt(form.meses)) : null;

  const mesesCalc = (mode === 'por_cuota' && parseFloat(form.ahorro_mensual) > 0 && restante > 0)
    ? Math.ceil(restante / parseFloat(form.ahorro_mensual)) : null;

  const ahorro_final = mode === 'por_plazo' ? ahorroCalc : parseFloat(form.ahorro_mensual || 0);
  const meses_final  = mode === 'por_plazo' ? parseInt(form.meses || 0) : mesesCalc;

  const ingreso = parseFloat(user?.ingreso_mensual || 0);
  const otrasMetasMes = goals
    .filter((g) => !isEdit || g.id !== meta?.id)
    .reduce((sum, g) => sum + parseFloat(g.ahorro_mensual || 0), 0);
  const libre = ingreso - totalServicios - totalCuotas;
  const disponible = libre - otrasMetasMes;
  const deficit = ahorro_final ? disponible - ahorro_final : null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.monto_objetivo) { setError(t('modal_goal_error_fields')); return; }
    if (!ahorro_final || ahorro_final <= 0)    { setError(t('modal_goal_error_plan'));   return; }

    const fd = new Date();
    fd.setMonth(fd.getMonth() + Math.max(1, meses_final || 1));
    const fecha_objetivo = fd.toISOString().split('T')[0];

    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre, categoria: form.categoria,
        monto_objetivo: parseFloat(form.monto_objetivo),
        monto_actual:   parseFloat(form.monto_actual || 0),
        ahorro_mensual: ahorro_final, fecha_objetivo,
      };
      if (isEdit) await updateGoal(meta.id, payload);
      else await addGoal(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('error_save'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>
          {isEdit ? <Pencil size={18} /> : <Target size={18} />}
          {isEdit ? t('modal_goal_edit') : t('modal_goal_new')}
        </h3>
        {error && (
          <div className="alert alert-r" style={{ marginBottom: 12 }}>
            <span className="alert-ico"><AlertCircle size={16} /></span>
            <div>{error}</div>
          </div>
        )}
        <form onSubmit={submit}>
          <div className="field">
            <label>{t('modal_goal_name')}</label>
            <input name="nombre" placeholder={t('modal_goal_name_ph')} value={form.nombre} onChange={handle} required />
          </div>
          <div className="field">
            <label>{t('modal_goal_cat')}</label>
            <select name="categoria" value={form.categoria} onChange={handle}>
              {CATEGORIAS.map((c) => <option key={c.label} value={c.label}>{c.emoji} {t(c.key)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('modal_goal_target')}</label>
            <input type="number" name="monto_objetivo" placeholder="0" value={form.monto_objetivo} onChange={handle} required />
          </div>
          <div className="field">
            <label>{t('modal_goal_current')}</label>
            <input type="number" name="monto_actual" placeholder="0" value={form.monto_actual} onChange={handle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('modal_goal_plan')}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button type="button" className={`btn ${mode === 'por_plazo' ? 'btn-p' : 'btn-o'}`} style={{ flex: 1, fontSize: 12 }} onClick={() => setMode('por_plazo')}>
                {t('modal_goal_por_plazo')}
              </button>
              <button type="button" className={`btn ${mode === 'por_cuota' ? 'btn-p' : 'btn-o'}`} style={{ flex: 1, fontSize: 12 }} onClick={() => setMode('por_cuota')}>
                {t('modal_goal_por_cuota')}
              </button>
            </div>

            {mode === 'por_plazo' ? (
              <div className="field" style={{ marginBottom: 0 }}>
                <label>{t('modal_goal_months_q')}</label>
                <input type="number" name="meses" placeholder="12" value={form.meses} onChange={handle} min="1" />
                {ahorroCalc && (
                  <div style={{ marginTop: 6, padding: '8px 12px', background: 'var(--gLight)', borderRadius: 8, fontSize: 12, color: 'var(--green2)', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Wallet size={13} />
                    <span dangerouslySetInnerHTML={{ __html: t('modal_goal_need', { amount: fmt(ahorroCalc), date: fechaMeta(parseInt(form.meses)) }) }} />
                  </div>
                )}
              </div>
            ) : (
              <div className="field" style={{ marginBottom: 0 }}>
                <label>{t('modal_goal_monthly_q')}</label>
                <input type="number" name="ahorro_mensual" placeholder="0" value={form.ahorro_mensual} onChange={handle} min="1" />
                {mesesCalc && (
                  <div style={{ marginTop: 6, padding: '8px 12px', background: 'var(--gLight)', borderRadius: 8, fontSize: 12, color: 'var(--green2)', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CalendarDays size={13} />
                    <span dangerouslySetInnerHTML={{ __html: t('modal_goal_achieve', { n: mesesCalc, date: fechaMeta(mesesCalc) }) }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {deficit !== null && ingreso > 0 && (
            <div className={`alert ${deficit < 0 ? 'alert-r' : deficit < ingreso * 0.05 ? 'alert-a' : 'alert-g'}`} style={{ marginBottom: 14 }}>
              <span className="alert-ico">{deficit < 0 ? <AlertTriangle size={16} /> : <Wallet size={16} />}</span>
              <div style={{ fontSize: 12 }}>
                {deficit < 0
                  ? <span dangerouslySetInnerHTML={{ __html: t('modal_goal_over', { amount: fmt(Math.abs(deficit)) }) }} />
                  : <span dangerouslySetInnerHTML={{ __html: t('modal_goal_left', { amount: fmt(deficit) }) }} />}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-p" type="submit" style={{ flex: 1 }} disabled={loading}>
              {loading ? t('saving') : t('modal_goal_save_btn')}
            </button>
            <button className="btn btn-o" type="button" style={{ flex: 1 }} onClick={onClose}>{t('btn_cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
