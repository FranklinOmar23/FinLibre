import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fl_token');
    if (token) {
      // Intentar restaurar sesión con el access token existente
      api.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => {
          // Si falla, el interceptor de axios intentará el refresh automáticamente.
          // Si el refresh también falla, redirige a /login por sí solo.
          localStorage.removeItem('fl_token');
        })
        .finally(() => setLoading(false));
    } else {
      // Sin access token, intentar refresh silencioso con la cookie httpOnly
      api.post('/auth/refresh', {})
        .then((res) => {
          localStorage.setItem('fl_token', res.data.token);
          setUser(res.data.user);
        })
        .catch(() => {}) // sin cookie válida → quedarse en loading=false sin usuario
        .finally(() => setLoading(false));
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('fl_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (nombre, email, password, ingreso_mensual, frecuencia_cobro, dia_cobro) => {
    const res = await api.post('/auth/register', {
      nombre, email, password, ingreso_mensual,
      frecuencia_cobro: frecuencia_cobro || null,
      dia_cobro: dia_cobro || null,
    });
    localStorage.setItem('fl_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  // Usado por Google OAuth y WebAuthn
  const loginWithToken = (token, userData) => {
    localStorage.setItem('fl_token', token);
    setUser(userData);
  };

  const updateUser = (data) => setUser((prev) => ({ ...prev, ...data }));

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // limpia la cookie httpOnly en el servidor
    } catch (_) {}
    localStorage.removeItem('fl_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithToken, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
