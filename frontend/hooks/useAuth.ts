
import { useAppStore } from '../store';

export const useAuth = () => {
  const user = useAppStore((state) => state.user);
  const token = useAppStore((state) => state.token);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const success = useAppStore((state) => state.success);
  const register = useAppStore((state) => state.register);
  const login = useAppStore((state) => state.login);
  const logout = useAppStore((state) => state.logout);
  const initializeAuth = useAppStore((state) => state.initializeAuth); // Add initializeAuth
  const clearSuccess = useAppStore((state) => state.clearSuccess);
  const updateAuthenticatedUser = useAppStore((state) => state.updateAuthenticatedUser); // New

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    success,
    register,
    login,
    logout,
    initializeAuth,
    clearSuccess,
    updateAuthenticatedUser, // New
  };
};
