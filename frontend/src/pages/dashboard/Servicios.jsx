import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLang } from '../../context/LangContext';
import ModalServicio from '../../components/ModalServicio';
import { Receipt, Home, Zap, Wifi, Tv2, HeartPulse, Car, Package } from 'lucide-react';

const CAT_ICON = {
  Vivienda: Home, Utilidades: Zap, Comunicación: Wifi,
  Entretenimiento: Tv2, Salud: HeartPulse, Transporte: Car, Otro: Package,
};

const CAT_COLORS = {
  Vivienda: 'rgba(224,82,82,.12)', Utilidades: 'rgba(91,164,224,.12)',
  Comunicación: 'rgba(91,164,224,.12)', Entretenimiento: 'rgba(239,159,39,.12)',
  Salud: 'rgba(29,158,117,.12)', Transporte: 'rgba(239,159,39,.12)', Otro: 'rgba(29,158,117,.12)',
};

export default function Servicios() {
  const { services, removeService, totalServicios } = useFinance();
  const { t, fmt } = useLang();
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const handleDelete = async (id) => {
    await removeService(id);
    setConfirmDel(null);
  };

  return (
    <div className="view">
      <div className="topbar">
        <div>
          <div className="page-title">{t('servicios_title')}</div>
          <div className="page-sub">{t('servicios_sub')}</div>
        </div>
        <button className="btn btn-p" onClick={() => setShowModal(true)}>{t('servicios_btn_new')}</button>
      </div>

      <div className="card hero-blue" style={{ marginBottom: 18 }}>
        <div className="hero-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Receipt size={13} /> {t('servicios_total_label')}
        </div>
        <div className="hero-val">{fmt(totalServicios)}</div>
        <div className="hero-sub">{t('servicios_n_active', { n: services.length })}</div>
      </div>

      <div className="card">
        <div className="sec-label">{t('servicios_all')}</div>
        {services.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <Receipt size={44} style={{ color: 'var(--text4)' }} className="anim-scale" />
            </div>
            <div>{t('servicios_empty')}</div>
            <button className="btn btn-p" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>{t('servicios_btn_first')}</button>
          </div>
        )}
        {services.map((s) => {
          const pct = totalServicios > 0 ? Math.round((parseFloat(s.monto) / totalServicios) * 100) : 0;
          const CatIcon = CAT_ICON[s.categoria] || Package;
          return (
            <div className="row" key={s.id}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div className="row-ico" style={{ background: CAT_COLORS[s.categoria] || 'rgba(29,158,117,.12)' }}>
                  <CatIcon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="row-name">{s.nombre}</div>
                  <div className="row-sub">{t(`cat_${s.categoria}`)} · {t('servicios_monthly')}</div>
                  <div className="pbar-bg" style={{ marginTop: 6, maxWidth: 220 }}>
                    <div className="pbar-fill" style={{ width: `${pct}%`, background: 'var(--blue)' }} />
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: 12 }}>
                <div className="row-amt">{fmt(s.monto)}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{pct}%</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
                  <button className="btn btn-o" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => { setEditando(s); setShowModal(true); }}>{t('btn_edit')}</button>
                  <button className="btn btn-r" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setConfirmDel(s.id)}>{t('btn_delete')}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(showModal || editando) && (
        <ModalServicio servicio={editando} onClose={() => { setShowModal(false); setEditando(null); }} />
      )}

      {confirmDel && (
        <div className="overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" style={{ maxWidth: 320 }} onClick={(e) => e.stopPropagation()}>
            <h3>{t('confirm_delete_title')}</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', margin: '12px 0' }}>{t('confirm_delete_sub')}</p>
            <div className="modal-actions">
              <button className="btn btn-r" style={{ flex: 1 }} onClick={() => handleDelete(confirmDel)}>{t('yes_delete')}</button>
              <button className="btn btn-o" style={{ flex: 1 }} onClick={() => setConfirmDel(null)}>{t('btn_cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
