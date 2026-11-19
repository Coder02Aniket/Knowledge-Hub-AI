import { create } from 'zustand';
import { authApi } from '../api/auth';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
  checkStatus: () => Promise<void>;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  setUnauthenticated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  username: null,
  isLoading: true,
  checkStatus: async () => {
    try {
      const data = await authApi.status();
      set({ isAuthenticated: data.authenticated, username: data.username || null, isLoading: false });
    } catch {
      set({ isAuthenticated: false, username: null, isLoading: false });
    }
  },
  login: async (credentials) => {
    const data = await authApi.login(credentials);
    set({ isAuthenticated: true, username: data.username });
  },
  logout: async () => {
    await authApi.logout();
    set({ isAuthenticated: false, username: null });
  },
  setUnauthenticated: () => {
    set({ isAuthenticated: false, username: null });
  }
}));

window.addEventListener('unauthorized', () => {
  useAuthStore.getState().setUnauthenticated();
});
