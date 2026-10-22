import axios, { AxiosError } from 'axios';
import { config } from '../config/env';
import { getActiveProjectId, PROJECT_HEADER } from './activeProject';
import { scheduleGlobalErrorToast, translateAxiosError } from './apiError';

const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 100000,
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Proyecto activo del selector del header; el backend filtra la información por él
    const projectId = getActiveProjectId();
    if (projectId && !config.headers.has(PROJECT_HEADER)) {
      config.headers.set(PROJECT_HEADER, String(projectId));
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;

    // Mensaje entendible para el usuario: quien use `err.message` ya recibe el texto amigable
    const friendlyMessage = translateAxiosError(error);
    error.message = friendlyMessage;

    if (status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    } else if (status !== 422 && !axios.isCancel(error)) {
      // Los 422 los muestran los formularios junto a sus campos; el resto se notifica
      // en un toast si el componente que hizo la petición no lo maneja
      scheduleGlobalErrorToast(error, friendlyMessage);
    }

    return Promise.reject(error);
  }
);

export default api;