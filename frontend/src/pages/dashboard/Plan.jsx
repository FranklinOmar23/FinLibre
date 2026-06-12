import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useLang } from '../../context/LangContext';
import { calcDeducciones } from '../../utils/deducciones';
import { Target, PartyPopper, TrendingUp, Trophy, AlertTriangle } from 'lucide-react';

export default function Plan() {
  const { user } = useAuth();
  const { debts, services, totalServicios, totalCuotas } = useFinance();
  const { t, fmt, months } = useLang();

  const ingreso = parseFloat(user?.ingreso_mensual || 0);
  const { neto } = calcDeducciones(ingreso, user?.regimen || 'RD_FORMAL', parseFloat(user?.deduccion_pct || 0));
  const libre = neto - totalServicios - totalCuotas;

  const fechaLibre = (meses) => {
    const d = new Date();
    d.setMonth(d.getMonth() + meses);
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const snowball = [...debts].sort((a, b) => {
    const ra = parseFloat(a.monto_total) - parseFloat(a.monto_pagado);
    const rb = parseFloat(b.monto_total) - parseFloat(b.monto_pagado);
    return ra - rb;
  });

  const maxMeses = debts.length
    ? Math.max(...debts.map((d) => {
        const r = parseFloat(d.monto_total) - parseFloat(d.monto_pagado);
        return Math.ceil(r / parseFloat(d.cuota_mensual));
      }))
    : 0;

  const ocio = services.filter((s) => s.categoria === 'Entretenimiento');
  const totalOcio = ocio.reduce((sum, s) => sum + parseFloat(s.monto || 0), 0);

  const calcConExtra = () => {
    if (!debts.length || !totalOcio) return maxMeses;
    let extraPool = totalOcio;
    let mes = 0;
    const saldo = snowball.map((d) => parseFloat(d.monto_total) - parseFloat(d.monto_pagado));
    const cuotas = snowball.map((d) => parseFloat(d.cuota_mensual));
    while (saldo.some((s) => s > 0) && mes < 240) {
      mes++;
      for (let i = 0; i < saldo.length; i++) {
        if (saldo[i] <= 0) continue;
        const pago = cuotas[i] + (i === 0 ? extraPool : 0);
        saldo[i] = Math.max(0, saldo[i] - pago);
        if (saldo[i] === 0) extraPool += cuotas[i];
      }
    }
    return mes;
  };

  const mesesConExtra = calcConExtra();

  return (
    <div className="view">
      <div className="topbar">
        <div>
          <div className="page-title">{t('plan_title')}</div>
          <div className="page-sub">{t('plan_sub')}</div>
        </div>
      </div>

      <div className="card hero-amber" style={{ marginBottom: 18 }}>
        <div className="hero-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Target size={13} /> {t('plan_free_in')}
        </div>
        <div className="hero-val" style={{ color: '#ffd580' }}>{maxMeses > 0 ? t('deudas_n_months', { n: maxMeses }) : t('plan_already_free')}</div>
        <div className="hero-sub">{maxMeses > 0 ? t('plan_following', { date: fechaLibre(maxMeses) }) : t('plan_no_debts')}</div>
      </div>

      <div className="g2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="sec-label">{t('plan_snowball')}</div>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}
            dangerouslySetInnerHTML={{ __html: t('plan_snowball_desc') }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{maxMeses}m</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{t('plan_current')}</div>
            </div>
            {totalOcio > 0 && (
              <div style={{ flex: 1, background: 'rgba(29,158,117,.1)', borderRadius: 10, padding: 12, textAlign: 'center', border: '1px solid var(--border2)' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green2)', fontFamily: 'var(--mono)' }}>{mesesConExtra}m</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{t('plan_trim_leisure')}</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="sec-label">{t('plan_free_monthly')}</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--green2)', fontFamily: 'var(--mono)', marginBottom: 8 }}>{fmt(libre)}</div>
          <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: t('plan_add_extra') }} />
          {totalOcio > 0 && (
            <div style={{ marginTop: 12 }} className="alert alert-g">
              <span className="alert-ico"><TrendingUp size={16} /></span>
              <div style={{ fontSize: 12 }}
                dangerouslySetInnerHTML={{ __html: t('plan_extra_result', { amount: fmt(totalOcio), n: maxMeses - mesesConExtra }) }} />
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="sec-label">{t('plan_steps')}</div>
        {debts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <PartyPopper size={42} style={{ color: 'var(--green2)' }} className="anim-scale" />
            </div>
            <div>{t('plan_empty')}</div>
          </div>
        )}
        {ocio.length > 0 && (
          <div className="plan-step">
            <div className="ps-c ps-a" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={14} />
            </div>
            <div>
              <h4>{t('plan_action')}</h4>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, lineHeight: 1.55 }}>
                {ocio.map((s) => s.nombre).join(' + ')} = {fmt(totalOcio)}/mes. {t('plan_extra_result', { amount: fmt(totalOcio), n: maxMeses - mesesConExtra }).replace(/<[^>]*>/g, '')}
              </p>
            </div>
          </div>
        )}
        {snowball.map((d, i) => {
          const restante = parseFloat(d.monto_total) - parseFloat(d.monto_pagado);
          const meses = Math.ceil(restante / parseFloat(d.cuota_mensual));
          return (
            <div className="plan-step" key={d.id}>
              <div className="ps-c ps-g">{i + 1}</div>
              <div>
                <h4>{t('plan_pay_first', { name: d.nombre, amount: fmt(restante) })}</h4>
                <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, lineHeight: 1.55 }}>
                  <span dangerouslySetInnerHTML={{ __html: t('plan_detail', { amount: fmt(d.cuota_mensual), n: meses }) }} />
                  {' '}<span className="chip chip-g" style={{ fontSize: 10, marginLeft: 4 }}>{t('plan_step_label', { n: i + 1 })}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {maxMeses > 0 && (
        <div style={{ marginTop: 14 }} className="alert alert-g">
          <span className="alert-ico"><Trophy size={16} /></span>
          <div><strong>Lib:</strong> {t('plan_lib_quote', { n: maxMeses })}</div>
        </div>
      )}
    </div>
  );
}
