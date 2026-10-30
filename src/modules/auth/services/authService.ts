import api from '../../../lib/axios';

export const authService = {
  login: async (credentials: any) => {
    const { data } = await api.post('/v1/auth/login', credentials);
    return data;
  },
  /** Envía el enlace para restablecer la contraseña (la respuesta es la misma exista o no el correo) */
  forgotPassword: async (email: string): Promise<string> => {
    const { data } = await api.post('/v1/auth/forgot-password', { email });
    return data.message;
  },
  resetPassword: async (payload: { token: string; email: string; password: string; password_confirmation: string }): Promise<string> => {
    const { data } = await api.post('/v1/auth/reset-password', payload);
    return data.message;
  },
  logout: async () => {
    const { data } = await api.post('/v1/auth/logout');
    return data;
  }
};
