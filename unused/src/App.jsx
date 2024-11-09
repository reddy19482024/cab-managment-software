import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider as AntdConfigProvider } from 'antd';
import { ConfigProvider } from './contexts/ConfigContext';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';

const App = () => {
  return (
    <ConfigProvider>
      <BrowserRouter>
        <AuthProvider>
          <AntdConfigProvider>
            <AppRoutes />
          </AntdConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;