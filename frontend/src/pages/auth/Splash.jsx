import { useNavigate } from 'react-router-dom';
import { LibFull } from '../../components/LibSVG';

export default function Splash() {
  const nav = useNavigate();
  return (
    <div className="auth-view">
      <div className="auth-glow" />
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="float-anim" style={{ marginBottom: 20 }}>
          <LibFull size={110} />
        </div>
        <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -2, marginBottom: 6 }}>FinLibre</div>
        <div style={{ fontSize: 15, color: 'var(--text3)', marginBottom: 44, lineHeight: 1.5 }}>
          Tus finanzas,<br />tu libertad 🦅
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
          <button
            className="btn btn-p"
            style={{ justifyContent: 'center', padding: '16px', fontSize: 15, borderRadius: 14, width: '100%', boxShadow: '0 4px 28px rgba(29,158,117,.4)' }}
            onClick={() => nav('/register')}
          >
            Crear cuenta gratis
          </button>
          <button
            className="btn btn-o"
            style={{ justifyContent: 'center', padding: '16px', fontSize: 14, borderRadius: 14, width: '100%' }}
            onClick={() => nav('/login')}
          >
            Ya tengo cuenta
          </button>
        </div>
        <div style={{ marginTop: 28, fontSize: 11, color: 'var(--text4)' }}>
          Gratis · Sin anuncios · Hecho con 💪
        </div>
      </div>
    </div>
  );
}
