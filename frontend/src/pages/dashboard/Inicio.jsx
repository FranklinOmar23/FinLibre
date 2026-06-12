import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useLang } from '../../context/LangContext';
import { calcDeducciones } from '../../utils/deducciones';
import ModalServicio from '../../components/ModalServicio';
import {
  Leaf, AlertTriangle, CalendarDays, PartyPopper,
  Wallet, DollarSign, Receipt, CreditCard, Sparkles,
} from 'lucide-react';

export default function Inicio() {
  const { user } = useAuth();
  const { services, debts, totalServicios, totalCuotas, totalDeuda } = useFinance();
  const { t, fmt } = useLang();
  const [showModal, setShowModal] = useState(false);

  const ingreso = parseFloat(user?.ingreso_mensual || 0);
  const regimen = user?.regimen || 'RD_FORMAL';
  const pct = parseFloat(user?.deduccion_pct || 0);
  const { afp, sfs, isr, dedu, neto } = calcDeducciones(ingreso, regimen, pct);

  const libre = neto - totalServicios - totalCuotas;
  const comprometido = neto > 0 ? Math.round(((totalServicios + totalCuotas) / neto) * 100) : 0;
  const score = Math.max(0, Math.min(100, 100 - comprometido));

  const scoreColor = score >= 60 ? 'var(--green2)' : score >= 40 ? 'var(--amber)' : 'var(--red)';
  const scoreLabel = score >= 60 ? t('inicio_health_good') : score >= 40 ? t('inicio_health_risk') : t('inicio_health_bad');

  const maxMeses = debts.length
    ? Math.max(...debts.map((d) => {
        const restante = parseFloat(d.monto_total) - parseFloat(d.monto_pagado);
        return Math.ceil(restante / parseFloat(d.cuota_mensual));
      }))
    : 0;

  const nombre = user?.nombre?.split(' ')[0] || '';

  const showDeductions = ingreso > 0 && regimen !== 'NONE';
  const deduRows = showDeductions
    ? regimen === 'RD_FORMAL'
      ? [
          { label: t('dedu_afp'), note: '2.87 %', val: afp },
          { label: t('dedu_sfs'), note: '3.04 %', val: sfs },
          ...(isr > 0 ? [{ label: t('dedu_isr'), note: '', val: isr }] : []),
        ]
      : dedu > 0
        ? [{ label: t('dedu_custom_label', { pct }), note: '', val: dedu }]
        : []
    : [];

  return (
    <div className="view">
      <div className="topbar">
        <div>
          <div className="page-title">FinLibre</div>
          <div className="page-sub">{t('inicio_hello', { name: nombre })}</div>
        </div>
        <button className="btn btn-p" onClick={() => setShowModal(true)}>{t('inicio_btn_add')}</button>
      </div>

      <div className="card hero-green" style={{ marginBottom: 18 }}>
        <div className="hero-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Leaf size={13} /> {t('inicio_free_label')}
        </div>
        <div className="hero-val">{fmt(libre)}</div>
        <div className="hero-sub">{t('inicio_free_sub')}</div>
        <div style={{ marginTop: 18, height: 6, background: 'rgba(0,0,0,.2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: 6, background: 'rgba(255,255,255,.45)', borderRadius: 3,
            width: `${Math.max(0, 100 - comprometido)}%`,
            transition: 'width 1s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: .6, marginTop: 5 }}>
          <span>{t('inicio_pct_free', { n: 100 - comprometido })}</span>
          <span>{t('inicio_pct_committed', { n: comprometido })}</span>
        </div>
      </div>

      <div className="g4 stagger-list" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-val" style={{ color: 'var(--green2)' }}>{fmt(ingreso > 0 ? neto : 0)}</div>
          <div className="stat-lbl">{ingreso > 0 ? t('inicio_net_income') : t('inicio_income')}</div>
        </div>
        <div className="stat">
          <div className="stat-val" style={{ color: 'var(--blue)' }}>{fmt(totalServicios)}</div>
          <div className="stat-lbl">{t('inicio_services')}</div>
        </div>
        <div className="stat">
          <div className="stat-val" style={{ color: 'var(--red)' }}>{fmt(totalCuotas)}</div>
          <div className="stat-lbl">{t('inicio_debts_stat')}</div>
        </div>
        <div className="stat">
          <div className="stat-val" style={{ color: 'var(--amber)' }}>{fmt(totalDeuda)}</div>
          <div className="stat-lbl">{t('inicio_total_debt')}</div>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="sec-label">{t('inicio_health')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <svg width="84" height="84" viewBox="0 0 84 84">
              <circle cx="42" cy="42" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
              <circle cx="42" cy="42" r="34" fill="none" stroke={scoreColor} strokeWidth="8"
                strokeDasharray="213" strokeDashoffset={213 - (213 * score / 100)}
                strokeLinecap="round" transform="rotate(-90 42 42)"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}/>
              <text x="42" y="47" textAnchor="middle" fontSize="14" fontWeight="700" fill={scoreColor} fontFamily="'JetBrains Mono'">{score}%</text>
            </svg>
            <div>
              <div className={`chip ${score >= 60 ? 'chip-g' : score >= 40 ? 'chip-a' : 'chip-r'}`} style={{ marginBottom: 8 }}>
                {scoreLabel}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}>
                {t('inicio_health_desc', { n: comprometido })}<br />
                {t('inicio_health_goal')}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="sec-label">{t('inicio_alerts')}</div>
          {comprometido > 80 && (
            <div className="alert alert-r">
              <span className="alert-ico"><AlertTriangle size={16} /></span>
              <div>{t('inicio_alert_over')}</div>
            </div>
          )}
          {maxMeses > 0 && (
            <div className="alert alert-a">
              <span className="alert-ico"><CalendarDays size={16} /></span>
              <div>{t('inicio_alert_debt_in', { n: maxMeses })}</div>
            </div>
          )}
          {debts.length === 0 && (
            <div className="alert alert-g">
              <span className="alert-ico"><PartyPopper size={16} /></span>
              <div>{t('inicio_alert_no_debts')}</div>
            </div>
          )}
          {libre > 0 && (
            <div className="alert alert-g">
              <span className="alert-ico"><Wallet size={16} /></span>
              <div dangerouslySetInnerHTML={{ __html: t('inicio_alert_free', { amount: `<strong>${fmt(libre)}</strong>` }) }} />
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="sec-label">{t('inicio_summary')}</div>

        {/* Ingreso (bruto o neto según régimen) */}
        <div className="row">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="row-ico" style={{ background: 'rgba(29,158,117,.12)' }}><DollarSign size={18} /></div>
            <div>
              <div className="row-name">{regimen === 'NONE' ? t('inicio_net_income') : t('dedu_bruto')}</div>
              <div className="row-sub">{t('inicio_salary')}</div>
            </div>
          </div>
          <div className="row-amt" style={{ color: 'var(--green2)' }}>{fmt(ingreso)}</div>
        </div>

        {/* Filas de deducciones */}
        {deduRows.map((d) => (
          <div key={d.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 0 6px 54px',
            borderBottom: '1px solid var(--border2)',
          }}>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              {d.label}
              {d.note && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.65 }}>{d.note}</span>}
            </div>
            <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text3)', fontWeight: 600 }}>
              −{fmt(d.val)}
            </div>
          </div>
        ))}

        {/* Subtotal neto (solo cuando hay deducciones) */}
        {showDeductions && deduRows.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '9px 0 9px 54px', marginBottom: 2,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>{t('dedu_neto')}</span>
            <span style={{ fontSize: 14, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--green2)' }}>{fmt(neto)}</span>
          </div>
        )}

        {/* Servicios */}
        <div className="row">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="row-ico" style={{ background: 'rgba(91,164,224,.12)' }}><Receipt size={18} /></div>
            <div><div className="row-name">{t('inicio_services')}</div><div className="row-sub">{t('inicio_n_services', { n: services.length })}</div></div>
          </div>
          <div className="row-amt" style={{ color: 'var(--blue)' }}>−{fmt(totalServicios)}</div>
        </div>

        {/* Cuotas */}
        <div className="row">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="row-ico" style={{ background: 'rgba(224,82,82,.12)' }}><CreditCard size={18} /></div>
            <div><div className="row-name">{t('inicio_debts_stat')}</div><div className="row-sub">{t('inicio_n_debts', { n: debts.length })}</div></div>
          </div>
          <div className="row-amt" style={{ color: 'var(--red)' }}>−{fmt(totalCuotas)}</div>
        </div>

        {/* Dinero libre */}
        <div className="row" style={{ borderTop: '1px solid var(--border2)', marginTop: 6, paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="row-ico" style={{ background: 'rgba(29,158,117,.2)' }}><Sparkles size={18} /></div>
            <div>
              <div className="row-name" style={{ fontSize: 16, fontWeight: 700 }}>{t('inicio_free_money')}</div>
              <div className="row-sub">{t('inicio_to_spend')}</div>
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green2)', fontFamily: 'var(--mono)' }}>{fmt(libre)}</div>
        </div>
      </div>

      {showModal && <ModalServicio onClose={() => setShowModal(false)} />}
    </div>
  );
}
