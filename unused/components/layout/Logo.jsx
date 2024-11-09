// frontend/src/components/layouts/components/Logo.jsx
import React from 'react';
import { useConfig } from '@/contexts/ConfigContext';

export const Logo = ({ config }) => {
  const { app } = useConfig();
  
  return (
    <img 
      src="/assets/logo.svg"
      alt={app.name}
      style={{
        height: config.height,
        margin: config.margin
      }}
    />
  );
};