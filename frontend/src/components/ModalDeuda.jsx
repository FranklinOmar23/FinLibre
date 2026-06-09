import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLang } from '../context/LangContext';
import { Pencil, CreditCard, AlertCircle, Clock } from 'lucide-react';

const TIPOS = [
  { label: 'Préstamo bancario',  key: 'debt_Préstamo bancario',  emoji: '🏦' },
  { label: 'Tarjeta de crédito', key: 'debt_Tarjeta de crédito', emoji: '💳' },
  { label: 'Deuda personal',     key: 'debt_Deuda personal',     emoji: '🤝' },
  { label: 'Hipoteca',           key: 'debt_Hipoteca',           emoji: '🏠' },
  { label: 'Otro',               key: 'debt_Otro',               emoji: '📦' },
];

export default function ModalDeuda({ onClose, deuda }) {
  const { addDebt, updateDebt } = useFinance();
  const { t } = useLang();
  const isEdit = !!deuda;

  const [form, setForm] = useState({
    nombre:        deuda?.nombre        || '',
    monto_total:   deuda?.monto_total   || '',
    monto_pagado:  deuda?.monto_pagado  || '0',
    cuota_mensual: deuda?.cuota_mensual || '',
    tipo:          deuda?.tipo          || 'Otro',
    emoji:         deuda?.emoji         || '📦',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => {
    const { name, value } = e.target;
    if (name === 'tipo') {
      const found = TIPOS.find((x) => x.label === value);
      setForm({ ...form, tipo: value, emoji: found?.emoji || '📦' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const mesesRestantes = form.monto_total && form.cuota_mensual
    ? Math.ceil((parseFloat(form.monto_total) - parseFloat(form.monto_pagado || 0)) / parseFloat(form.cuota_mensual))
    : null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.monto_total || !form.cuota_mensual) { setError(t('modal_debt_error')); return; }
    setLoading(true);
    try {
      if (isEdit) await updateDebt(deuda.id, form);
      else await addDebt(form);
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
          {isEdit ? <Pencil size={18} /> : <CreditCard size={18} />}
          {isEdit ? t('modal_debt_edit') : t('modal_debt_new')}
        </h3>
        {error && (
          <div className="alert alert-r" style={{ marginBottom: 12 }}>
            <span className="alert-ico"><AlertCircle size={16} /></span>
            <div>{error}</div>
          </div>
        )}
        <form onSubmit={submit}>
          <div className="field"><label>{t('modal_debt_name')}</label><input name="nombre" placeholder={t('modal_debt_name_ph')} value={form.nombre} onChange={handle} required /></div>
          <div className="field"><label>{t('modal_debt_total')}</label><input type="number" name="monto_total" placeholder="0" value={form.monto_total} onChange={handle} required /></div>
          <div className="field"><label>{t('modal_debt_paid')}</label><input type="number" name="monto_pagado" placeholder="0" value={form.monto_pagado} onChange={handle} /></div>
          <div className="field">
            <label>{t('modal_debt_monthly')}</label>
            <input type="number" name="cuota_mensual" placeholder="0" value={form.cuota_mensual} onChange={handle} required />
            {mesesRestantes !== null && mesesRestantes > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--green2)', padding: '8px 12px', background: 'var(--gLight)', borderRadius: 8, marginTop: 6 }}>
                <Clock size={13} /> {t('modal_debt_months_info', { n: mesesRestantes })}
              </div>
            )}
          </div>
          <div className="field">
            <label>{t('modal_debt_type')}</label>
            <select name="tipo" value={form.tipo} onChange={handle}>
              {TIPOS.map((tp) => <option key={tp.label} value={tp.label}>{tp.emoji} {t(tp.key)}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-p" type="submit" style={{ flex: 1 }} disabled={loading}>{loading ? t('saving') : t('btn_save')}</button>
            <button className="btn btn-o" type="button" style={{ flex: 1 }} onClick={onClose}>{t('btn_cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
