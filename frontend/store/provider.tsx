
"use client";

import { useRef } from 'react';
import { useStore } from '.';

const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const store = useRef(useStore).current;
  // You can add initialization logic here if needed
  return <>{children}</>;
};

export default StoreProvider;
