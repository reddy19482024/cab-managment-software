// frontend/src/services/api/config.js
import axios from 'axios';

export const createApiInstance = (config) => {
  const instance = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout || 30000,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...config.headers
    }
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};