import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:8080/api/v1`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  withCredentials: true,
});

// Interceptor para adjuntar X-Tenant-ID y manejar autenticación mediante Cookies HTTP-Only
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('jwt_token') || localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantId = sessionStorage.getItem('active_copropiedad_id') || localStorage.getItem('active_copropiedad_id') || '1';
    config.headers['X-Tenant-ID'] = tenantId;

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    console.error(`[FRONTEND API REQUEST ERROR] ❌`, error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
