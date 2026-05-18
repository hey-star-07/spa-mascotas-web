import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

let inactivityTimer: NodeJS.Timeout;

const resetInactivityTimer = () => {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login?expired=true';
  }, INACTIVITY_TIMEOUT);
};

if (typeof window !== 'undefined') {
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, resetInactivityTimer);
  });
  resetInactivityTimer();
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  resetInactivityTimer();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 👇 NO REDIRIGIR SI ES UN 401 DE LOGIN (el usuario está intentando loguearse)
    if (error.response?.status === 401 && originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    // 👇 NO REDIRIGIR SI YA INTENTÓ REFRESCAR
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Solo redirigir si NO está en la página de login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;