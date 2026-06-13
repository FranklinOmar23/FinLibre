import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLang } from '../context/LangContext';
import { CreditCard, PartyPopper, AlertCircle } from 'lucide-react';

export default function ModalAbonoDeuda({ deuda, onClose }) {
  const { abonarDeuda } = useFinance();
  const { t, fmt } = useLang();

  const restante = parseFloat(deuda.monto_total) - parseFloat(deuda.monto_pagado);
  const cuota    = parseFloat(deuda.cuota_mensual);

  const [monto, setMonto] = useState('');
  const [loading, setLoading]     = useState(false);
  const [liquidada, setLiquidada] = useState(false);
  const [error, setError]         = useState('');

  const montoNum   = parseFloat(String(monto).replace(/,/g, '')) || 0;
  const nuevoSaldo = Math.max(0, restante - montoNum);

  const RAPIDOS = [
    { label: t('deudas_abonar_quick_cuota'),  val: cuota },
    { label: t('deudas_abonar_quick_mitad'),  val: cuota / 2 },
    { label: t('deudas_abonar_quick_doble'),  val: cuota * 2 },
    { label: t('deudas_abonar_quick_todo'),   val: restante },
  ].filter((r) => r.val > 0 && r.val <= restante);

  const submit = async (e) => {
    e.preventDefault();
    if (montoNum <= 0) { setError(t('deudas_abonar_error')); return; }
    if (montoNum > restante) { setError(t('deudas_abonar_error_max', { amount: fmt(restante) })); return; }
    setError('');
    setLoading(true);
    try {
      const res = await abonarDeuda(deuda.id, montoNum);
      if (res.liquidada) {
        setLiquidada(true);
        setTimeout(onClose, 2200);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || t('error_save'));
    } finally {
      setLoading(false);
    }
  };

  if (liquidada) {
    return (
      <div className="overlay">
        <div className="modal" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <PartyPopper size={52} style={{ color: 'var(--green2)', margin: '0 auto 16px' }} className="anim-scale" />
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            {t('deudas_abonar_liquidada')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>{deuda.nombre}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CreditCard size={18} />
          {t('deudas_abonar_title', { name: deuda.nombre })}
        </h3>

        {/* Saldo actual */}
        <div style={{
          background: 'var(--bg3)', borderRadius: 10,
          border: '1px solid var(--border)', padding: '12px 14px',
          marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{t('deudas_abonar_balance')}</span>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--red)', fontSize: 15 }}>
            {fmt(restante)}
          </span>
        </div>

        {error && (
          <div className="alert alert-r" style={{ marginBottom: 12 }}>
            <span className="alert-ico"><AlertCircle size={16} /></span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={submit}>
          {/* Accesos rápidos */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
              {t('deudas_abonar_quick')}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {RAPIDOS.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setMonto(String(r.val))}
                  style={{
                    padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                    border: `1.5px solid ${montoNum === r.val ? 'var(--green)' : 'var(--border2)'}`,
                    background: montoNum === r.val ? 'rgba(29,158,117,.12)' : 'var(--bg3)',
                    color: montoNum === r.val ? 'var(--green2)' : 'var(--text2)',
                    fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)',
                    transition: 'all .15s',
                  }}
                >
                  {r.label} · {fmt(r.val)}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="field">
            <label>{t('deudas_abonar_amount')}</label>
            <input
              type="number"
              min="1"
              max={restante}
              step="any"
              value={monto}
              onChange={(e) => { setMonto(e.target.value); setError(''); }}
              placeholder={fmt(cuota)}
              autoFocus
            />
          </div>

          {/* Preview nuevo saldo */}
          {montoNum > 0 && montoNum <= restante && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(29,158,117,.08)',
              border: '1px solid rgba(29,158,117,.2)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 12,
            }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                {nuevoSaldo === 0 ? '🎉 ' : ''}{t('deudas_abonar_new_balance')}
              </span>
              <span style={{
                fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14,
                color: nuevoSaldo === 0 ? 'var(--green2)' : 'var(--text1)',
              }}>
                {fmt(nuevoSaldo)}
              </span>
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-p" type="submit" style={{ flex: 1 }} disabled={loading || montoNum <= 0}>
              {loading ? t('saving') : t('btn_deposit')}
            </button>
            <button className="btn btn-o" type="button" style={{ flex: 1 }} onClick={onClose}>
              {t('btn_cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
