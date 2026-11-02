import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { onUnauthorized } from '../api/client';
import type { LoginRequest, RegisterRequest } from '../types/api';

export const AUTH_QUERY_KEY = ['auth', 'status'] as const;

export function useAuth() {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => authApi.getStatus(),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    return onUnauthorized(() => {
      queryClient.setQueryData(AUTH_QUERY_KEY, { authenticated: false });
    });
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, {
        authenticated: true,
        username: data.username,
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterRequest) => {
      await authApi.register(payload);
      return authApi.login({
        username: payload.username,
        password: payload.password,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, {
        authenticated: true,
        username: data.username,
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, { authenticated: false });
      queryClient.removeQueries({ queryKey: ['conversations'] });
      queryClient.removeQueries({ queryKey: ['chat'] });
      queryClient.removeQueries({ queryKey: ['documents'] });
    },
  });

  return {
    isAuthenticated: Boolean(statusQuery.data?.authenticated),
    username: statusQuery.data?.username ?? null,
    isLoading: statusQuery.isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}
