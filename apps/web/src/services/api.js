import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request: JWT token ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: 401 gelince otomatik logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vc_token');
      localStorage.removeItem('vc_tenant');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

