import { useAppStore } from '../store';

export const useUsers = () => {
  const users = useAppStore((state) => state.users);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const success = useAppStore((state) => state.success);
  const fetchUsers = useAppStore((state) => state.fetchUsers);
  const updateUser = useAppStore((state) => state.updateUser);
  const deleteUser = useAppStore((state) => state.deleteUser);
  const clearSuccess = useAppStore((state) => state.clearSuccess);

  return {
    users,
    loading,
    error,
    success,
    fetchUsers,
    updateUser,
    deleteUser,
    clearSuccess,
  };
};
