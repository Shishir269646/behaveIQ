
"use client";

import { useEffect, useRef } from 'react';
import { useAppStore } from './index';

const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const initializeAuth = useAppStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
};

export default StoreProvider;
