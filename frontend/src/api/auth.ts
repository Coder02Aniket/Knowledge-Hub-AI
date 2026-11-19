import { api, baseApi } from './client';

export const authApi = {
  status: async () => {
    const { data } = await baseApi.get('/auth/status');
    return data;
  },
  login: async (credentials: { username: string; password: string }) => {
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);
    
    const { data } = await api.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return data;
  },
  register: async (details: any) => {
    const { data } = await api.post('/auth/register', details);
    return data;
  },
  logout: async () => {
    await api.post('/auth/logout');
  }
};
