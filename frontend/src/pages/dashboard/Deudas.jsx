import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLang } from '../../context/LangContext';
import ModalDeuda from '../../components/ModalDeuda';
import {
  CreditCard, PartyPopper, Lightbulb, Check,
  Building2, Handshake, Home, Package,
} from 'lucide-react';

const TIPO_ICON = {
  'Préstamo bancario':  Building2,
  'Tarjeta de crédito': CreditCard,
  'Deuda personal':     Handshake,
  'Hipoteca':           Home,
  'Otro':               Package,
};

export default function Deudas() {
  const { debts, removeDebt, pagarCuota, totalCuotas, totalDeuda } = useFinance();
  const { t, fmt } = useLang();
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [pagando, setPagando] = useState(null);

  const maxMeses = debts.length
    ? Math.max(...debts.map((d) => {
        const restante = parseFloat(d.monto_total) - parseFloat(d.monto_pagado);
        return Math.ceil(restante / parseFloat(d.cuota_mensual));
      }))
    : 0;

  const handlePagar = async (id) => {
    setPagando(id);
    await pagarCuota(id);
    setPagando(null);
  };

  return (
    <div className="view">
      <div className="topbar">
        <div>
          <div className="page-title">{t('deudas_title')}</div>
          <div className="page-sub">{t('deudas_sub')}</div>
        </div>
        <button className="btn btn-p" onClick={() => setShowModal(true)}>{t('deudas_btn_new')}</button>
      </div>

      <div className="card hero-red" style={{ marginBottom: 18 }}>
        <div className="hero-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CreditCard size={13} /> {t('deudas_total_label')}
        </div>
        <div className="hero-val">{fmt(totalDeuda)}</div>
        <div className="hero-sub">{t('deudas_n_active', { n: debts.length })} · {t('deudas_cuota_label', { amount: fmt(totalCuotas) })}</div>
      </div>

      <div className="g3 stagger-list" style={{ marginBottom: 18 }}>
        <div className="stat" style={{ borderColor: 'rgba(224,82,82,.2)' }}>
          <div className="stat-val" style={{ color: 'var(--red)' }}>{debts.length}</div>
          <div className="stat-lbl">{t('deudas_active')}</div>
        </div>
        <div className="stat">
          <div className="stat-val" style={{ color: 'var(--amber)' }}>{fmt(totalCuotas)}</div>
          <div className="stat-lbl">{t('deudas_cuota')}</div>
        </div>
        <div className="stat" style={{ borderColor: 'rgba(29,158,117,.2)' }}>
          <div className="stat-val" style={{ color: 'var(--green2)' }}>{maxMeses > 0 ? t('deudas_n_months', { n: maxMeses }) : t('deudas_free')}</div>
          <div className="stat-lbl">{t('deudas_to_free')}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="sec-label">{t('deudas_active')}</div>
        {debts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <PartyPopper size={44} style={{ color: 'var(--green2)' }} className="anim-scale" />
            </div>
            <div style={{ fontWeight: 600, color: 'var(--green2)', marginBottom: 4 }}>{t('deudas_empty_title')}</div>
            <div>{t('deudas_empty_sub')}</div>
          </div>
        )}
        {debts.map((d) => {
          const restante = parseFloat(d.monto_total) - parseFloat(d.monto_pagado);
          const pct = parseFloat(d.monto_total) > 0
            ? Math.round((parseFloat(d.monto_pagado) / parseFloat(d.monto_total)) * 100)
            : 0;
          const meses = Math.ceil(restante / parseFloat(d.cuota_mensual));
          const isSmall = restante <= 15000;
          const TipoIcon = TIPO_ICON[d.tipo] || Package;

          return (
            <div className="row" key={d.id} style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="row-ico" style={{ background: isSmall ? 'rgba(29,158,117,.12)' : 'rgba(224,82,82,.12)' }}>
                      <TipoIcon size={18} />
                    </div>
                    <div>
                      <div className="row-name">{d.nombre}</div>
                      <div className="row-sub">{fmt(d.cuota_mensual)}/mes · {meses} meses</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="row-amt" style={{ color: isSmall ? 'var(--green2)' : 'var(--red)' }}>{fmt(restante)}</div>
                    <div style={{ marginTop: 3 }}>
                      <span className={`chip ${isSmall ? 'chip-g' : 'chip-r'}`} style={{ fontSize: 9 }}>
                        {isSmall ? t('deudas_almost') : t(`debt_${d.tipo}`)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pbar-bg">
                  <div className="pbar-fill" style={{ width: `${pct}%`, background: isSmall ? 'var(--green)' : 'var(--red)' }} />
                </div>
                <div className="pbar-labels">
                  <span>{t('deudas_paid', { amount: fmt(d.monto_pagado) })}</span>
                  <span>{t('deudas_remaining', { amount: fmt(restante) })}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    className="btn btn-p"
                    style={{ fontSize: 11, padding: '5px 12px', gap: 5 }}
                    onClick={() => handlePagar(d.id)}
                    disabled={pagando === d.id}
                  >
                    {pagando === d.id ? '...' : <><Check size={13} strokeWidth={2.5} /> {t('deudas_pay')}</>}
                  </button>
                  <button className="btn btn-o" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => { setEditando(d); setShowModal(true); }}>{t('btn_edit')}</button>
                  <button className="btn btn-r" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => setConfirmDel(d.id)}>{t('btn_delete')}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {debts.length > 0 && (
        <div className="alert alert-a">
          <span className="alert-ico"><Lightbulb size={16} /></span>
          <div dangerouslySetInnerHTML={{ __html: t('deudas_snowball') }} />
        </div>
      )}

      {(showModal || editando) && (
        <ModalDeuda deuda={editando} onClose={() => { setShowModal(false); setEditando(null); }} />
      )}

      {confirmDel && (
        <div className="overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" style={{ maxWidth: 320 }} onClick={(e) => e.stopPropagation()}>
            <h3>{t('confirm_delete_title')}</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', margin: '12px 0' }}>{t('confirm_delete_sub')}</p>
            <div className="modal-actions">
              <button className="btn btn-r" style={{ flex: 1 }} onClick={async () => { await removeDebt(confirmDel); setConfirmDel(null); }}>{t('yes_delete')}</button>
              <button className="btn btn-o" style={{ flex: 1 }} onClick={() => setConfirmDel(null)}>{t('btn_cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
