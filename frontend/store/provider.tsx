"use client";

import { useEffect } from 'react';
import { useAppStore } from './index';
import { useHasMounted } from '@/hooks/use-has-mounted';

const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const initializeAuth = useAppStore((state) => state.initializeAuth);
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (hasMounted) {
      initializeAuth();
    }
  }, [hasMounted, initializeAuth]);

  return <>{children}</>;
};

export default StoreProvider;
