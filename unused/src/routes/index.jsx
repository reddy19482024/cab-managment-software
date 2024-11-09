import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useConfig } from '../contexts/ConfigContext';
import { useAuth } from '../contexts/AuthContext';
import PageBuilder from '../builders/PageBuilder';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { config } = useConfig();
  const { isAuthenticated } = useAuth();

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      {Object.entries(config.pages || {}).map(([key, pageConfig]) => {
        if (pageConfig.public) {
          return (
            <Route
              key={pageConfig.path}
              path={pageConfig.path}
              element={<PageBuilder pageKey={key} />}
            />
          );
        }
        return null;
      })}

      {/* Protected Routes */}
      {Object.entries(config.pages || {}).map(([key, pageConfig]) => {
        if (!pageConfig.public) {
          return (
            <Route
              key={pageConfig.path}
              path={pageConfig.path}
              element={
                <PrivateRoute>
                  <PageBuilder pageKey={key} />
                </PrivateRoute>
              }
            />
          );
        }
        return null;
      })}

      {/* Default redirect */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? config.app.defaultRoute : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
};

export default AppRoutes;