// ISR tramos anuales DGII 2025 — República Dominicana (Ley 11-92, art. 296)
const T1 = 416220;
const T2 = 624329;
const T3 = 867123;

function isrAnual(imponible) {
  if (imponible <= T1) return 0;
  if (imponible <= T2) return (imponible - T1) * 0.15;
  if (imponible <= T3) return 31216 + (imponible - T2) * 0.20;
  return 79776 + (imponible - T3) * 0.25;
}

/**
 * Calcula deducciones salariales según el régimen del usuario.
 *
 * regimen:
 *   'RD_FORMAL' — empleado formal en RD (AFP 2.87 % + SFS 3.04 % + ISR DGII 2025)
 *   'CUSTOM'    — porcentaje personalizado (pct, 0-99 %)
 *   'NONE'      — el ingreso ingresado ya es neto; sin cálculo
 */
export function calcDeducciones(bruto, regimen = 'RD_FORMAL', pct = 0) {
  const b = Math.max(0, Number(bruto) || 0);
  if (b === 0) return { bruto: 0, afp: 0, sfs: 0, isr: 0, dedu: 0, neto: 0 };

  if (regimen === 'RD_FORMAL') {
    const afp = b * 0.0287;
    const sfs = b * 0.0304;
    const isr = isrAnual((b - afp - sfs) * 12) / 12;
    const neto = b - afp - sfs - isr;
    return { bruto: b, afp, sfs, isr, dedu: afp + sfs + isr, neto };
  }

  if (regimen === 'CUSTOM') {
    const dedu = b * (Math.max(0, Math.min(99, Number(pct) || 0)) / 100);
    return { bruto: b, afp: 0, sfs: 0, isr: 0, dedu, neto: b - dedu };
  }

  // NONE — el usuario ya sabe su neto
  return { bruto: b, afp: 0, sfs: 0, isr: 0, dedu: 0, neto: b };
}
