// frontend/src/layouts/AuthLayout.jsx
import React from 'react';
import { Layout } from 'antd';
import { useConfig } from '@/contexts/ConfigContext';

function AuthLayout({ children }) {
  const { theme } = useConfig();

  return (
    <Layout className="min-h-screen">
      <Layout.Content className="flex items-center justify-center p-4"
        style={{ 
          background: theme?.colors?.background?.default || '#f0f2f5',
          minHeight: '100vh'
        }}
      >
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-lg shadow-md">
            {children}
          </div>
        </div>
      </Layout.Content>
    </Layout>
  );
}

export default AuthLayout;