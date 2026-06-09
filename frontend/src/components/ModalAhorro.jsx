import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLang } from '../context/LangContext';
import { PiggyBank, Pencil, AlertCircle } from 'lucide-react';

export default function ModalAhorro({ onClose, ahorro }) {
  const { addSaving, updateSaving } = useFinance();
  const { t } = useLang();
  const isEdit = !!ahorro;

  const [form, setForm] = useState({
    nombre:         ahorro?.nombre         || '',
    monto_objetivo: ahorro?.monto_objetivo || '',
    monto_actual:   ahorro?.monto_actual   || '0',
    descripcion:    ahorro?.descripcion    || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.monto_objetivo) { setError(t('modal_saving_error')); return; }
    setLoading(true);
    try {
      if (isEdit) await updateSaving(ahorro.id, form);
      else await addSaving(form);
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
          {isEdit ? <Pencil size={18} /> : <PiggyBank size={18} />}
          {isEdit ? t('modal_saving_edit') : t('modal_saving_new')}
        </h3>
        {error && (
          <div className="alert alert-r" style={{ marginBottom: 12 }}>
            <span className="alert-ico"><AlertCircle size={16} /></span>
            <div>{error}</div>
          </div>
        )}
        <form onSubmit={submit}>
          <div className="field">
            <label>{t('modal_saving_name')}</label>
            <input name="nombre" placeholder={t('modal_saving_name_ph')} value={form.nombre} onChange={handle} required />
          </div>
          <div className="field">
            <label>{t('modal_saving_target')}</label>
            <input type="number" name="monto_objetivo" placeholder="0" value={form.monto_objetivo} onChange={handle} required />
          </div>
          <div className="field">
            <label>{t('modal_saving_current')}</label>
            <input type="number" name="monto_actual" placeholder="0" value={form.monto_actual} onChange={handle} />
          </div>
          <div className="field">
            <label>{t('modal_saving_desc')}</label>
            <input name="descripcion" placeholder={t('modal_saving_desc_ph')} value={form.descripcion} onChange={handle} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-p" type="submit" style={{ flex: 1 }} disabled={loading}>
              {loading ? t('saving') : t('btn_save')}
            </button>
            <button className="btn btn-o" type="button" style={{ flex: 1 }} onClick={onClose}>{t('btn_cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
