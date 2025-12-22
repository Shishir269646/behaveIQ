
import { useStore } from '../store';

export const useAuth = () => {
  const user = useStore((state) => state.user);
  const token = useStore((state) => state.token);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const register = useStore((state) => state.register);
  const login = useStore((state) => state.login);
  const logout = useStore((state) => state.logout);
  const getMe = useStore((state) => state.getMe);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout,
    getMe,
  };
};
