// src/layouts/AuthLayout.jsx
import React from 'react';
import { Layout, Card } from 'antd';
import { useConfig } from '../contexts/ConfigContext';

const { Content } = Layout;

const AuthLayout = ({ children }) => {
  const { config } = useConfig();
  const layoutConfig = config.layouts?.auth;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: layoutConfig?.background
      }}>
        <Card 
          style={{ 
            width: layoutConfig?.contentWidth || 400,
            padding: layoutConfig?.padding || 24
          }}
          bordered={false}
        >
          {children}
        </Card>
      </Content>
    </Layout>
  );
};

export default AuthLayout;