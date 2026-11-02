import { apiFetch } from './client';
import type { AuthStatusResponse, LoginRequest, RegisterRequest } from '../types/api';

export const authApi = {
  getStatus(): Promise<AuthStatusResponse> {
    return apiFetch<AuthStatusResponse>('/auth/status', {
      method: 'GET',
      skipUnauthorizedRedirect: true,
    });
  },

  login(credentials: LoginRequest): Promise<{ username: string }> {
    const body = new URLSearchParams();
    body.set('username', credentials.username);
    body.set('password', credentials.password);

    return apiFetch<{ username: string }>('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      skipUnauthorizedRedirect: true,
    });
  },

  register(payload: RegisterRequest): Promise<{ message: string; username: string }> {
    return apiFetch<{ message: string; username: string }>('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      skipUnauthorizedRedirect: true,
    });
  },

  logout(): Promise<void> {
    return apiFetch<void>('/api/auth/logout', {
      method: 'POST',
      skipUnauthorizedRedirect: true,
    });
  },
};
