import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLang } from '../context/LangContext';
import { Pencil, Plus, AlertCircle } from 'lucide-react';

const CATEGORIAS = [
  { label: 'Vivienda',        key: 'cat_Vivienda',        emoji: '🏠' },
  { label: 'Utilidades',      key: 'cat_Utilidades',      emoji: '⚡' },
  { label: 'Comunicación',    key: 'cat_Comunicación',    emoji: '📶' },
  { label: 'Entretenimiento', key: 'cat_Entretenimiento', emoji: '🎬' },
  { label: 'Salud',           key: 'cat_Salud',           emoji: '❤️' },
  { label: 'Transporte',      key: 'cat_Transporte',      emoji: '🚗' },
  { label: 'Otro',            key: 'cat_Otro',            emoji: '📦' },
];

export default function ModalServicio({ onClose, servicio }) {
  const { addService, updateService } = useFinance();
  const { t } = useLang();
  const isEdit = !!servicio;

  const [form, setForm] = useState({
    nombre:    servicio?.nombre    || '',
    monto:     servicio?.monto     || '',
    categoria: servicio?.categoria || 'Otro',
    emoji:     servicio?.emoji     || '📦',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => {
    const { name, value } = e.target;
    if (name === 'categoria') {
      const cat = CATEGORIAS.find((c) => c.label === value);
      setForm({ ...form, categoria: value, emoji: cat?.emoji || '📦' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.monto) { setError(t('modal_svc_error')); return; }
    setLoading(true);
    try {
      if (isEdit) await updateService(servicio.id, form);
      else await addService(form);
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
          {isEdit ? <Pencil size={18} /> : <Plus size={18} />}
          {isEdit ? t('modal_svc_edit') : t('modal_svc_new')}
        </h3>
        {error && (
          <div className="alert alert-r" style={{ marginBottom: 12 }}>
            <span className="alert-ico"><AlertCircle size={16} /></span>
            <div>{error}</div>
          </div>
        )}
        <form onSubmit={submit}>
          <div className="field"><label>{t('modal_svc_name')}</label><input name="nombre" placeholder={t('modal_svc_name_ph')} value={form.nombre} onChange={handle} required /></div>
          <div className="field"><label>{t('modal_svc_amount')}</label><input type="number" name="monto" placeholder="0" value={form.monto} onChange={handle} required /></div>
          <div className="field">
            <label>{t('modal_svc_cat')}</label>
            <select name="categoria" value={form.categoria} onChange={handle}>
              {CATEGORIAS.map((c) => <option key={c.label} value={c.label}>{c.emoji} {t(c.key)}</option>)}
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
