import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE,
  withCredentials: true, // envía la cookie httpOnly del refresh token
});

// Adjunta el access token y normaliza rutas con /
// (axios elimina el path del baseURL si la url empieza con /)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.url?.startsWith('/')) config.url = config.url.slice(1);
  return config;
});

// Flag para evitar bucle infinito si el refresh también falla
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Solo intentar refresh en 401 y si no es ya un endpoint de auth
    // (la URL ya tuvo el / inicial removido por el interceptor de request)
    const isAuthEndpoint = /auth\/(refresh|logout|login|register|google)/.test(original.url || '');

    if (err.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;

      if (isRefreshing) {
        // Encolar mientras se está refrescando
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      isRefreshing = true;

      try {
        // El refresh token viaja automáticamente en la cookie httpOnly
        const res = await axios.post(`${BASE}/auth/refresh`, {}, { withCredentials: true });
        const newToken = res.data.token;

        localStorage.setItem('fl_token', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        original.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(original); // reintentar la request original
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Refresh falló → sesión expirada definitivamente
        localStorage.removeItem('fl_token');
        if (window.location.pathname !== '/login') window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
