import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { translations } from '../i18n/translations';

const LangContext = createContext(null);

const CURRENCY_LOCALE = {
  DOP: 'es-DO', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB',
  BRL: 'pt-BR', MXN: 'es-MX', COP: 'es-CO', ARS: 'es-AR',
  CLP: 'es-CL', PEN: 'es-PE',
};

export const CURRENCIES = [
  { code: 'DOP', label: 'RD$ Peso dominicano',   flag: '🇩🇴' },
  { code: 'USD', label: '$ Dólar americano',       flag: '🇺🇸' },
  { code: 'EUR', label: '€ Euro',                  flag: '🇪🇺' },
  { code: 'GBP', label: '£ Libra esterlina',       flag: '🇬🇧' },
  { code: 'BRL', label: 'R$ Real brasileño',       flag: '🇧🇷' },
  { code: 'MXN', label: '$ Peso mexicano',         flag: '🇲🇽' },
  { code: 'COP', label: '$ Peso colombiano',       flag: '🇨🇴' },
  { code: 'ARS', label: '$ Peso argentino',        flag: '🇦🇷' },
  { code: 'CLP', label: '$ Peso chileno',          flag: '🇨🇱' },
  { code: 'PEN', label: 'S/ Sol peruano',          flag: '🇵🇪' },
];

export const LANGUAGES = [
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
];

export function LangProvider({ children }) {
  const { user } = useAuth();

  const idioma = user?.idioma || localStorage.getItem('fl_idioma') || 'es';
  const moneda = user?.moneda || localStorage.getItem('fl_moneda') || 'DOP';

  const t = useMemo(() => (key, vars) => {
    const lang = translations[idioma] || translations.es;
    let str = lang[key] ?? translations.es[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    return str;
  }, [idioma]);

  const months = (translations[idioma] || translations.es).months;

  const fmt = useMemo(() => (n) => {
    const locale = CURRENCY_LOCALE[moneda] || 'es-DO';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: moneda,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(Number(n || 0));
    } catch {
      return `${moneda} ${Number(n || 0).toLocaleString()}`;
    }
  }, [moneda]);

  return (
    <LangContext.Provider value={{ idioma, moneda, t, fmt, months }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
