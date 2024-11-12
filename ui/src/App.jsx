import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import PropTypes from 'prop-types';
import DynamicPage from './components/DynamicPage/DynamicPage';
import ReportPageBuilder from './components/ReportPageBuilder/ReportPageBuilder';
import SettingsPage from './components/SettingsPage/SettingsPage';
import ProfilePage from './components/ProfilePage/ProfilePage';
import AuthPageBuilder from './components/AuthPageBuilder/AuthPageBuilder';
import routesConfig from './config/routes.json';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route Wrapper
const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;
  }

  return children;
};

// Page Builder Component
const PageBuilder = ({ route, onAuthStateChange }) => {
  const Component = (() => {
    switch (route.type) {
      case 'auth':
        return <AuthPageBuilder configName={route.componentConfig} onAuthStateChange={onAuthStateChange} />;
      case 'dashboard':
      case 'report':
        return <ReportPageBuilder configName={route.componentConfig} />;
      case 'settings':
        return <SettingsPage configName={route.componentConfig} />;
      case 'profile':
        return <ProfilePage configName={route.componentConfig} />;
      case 'management':
      default:
        return <DynamicPage configName={route.componentConfig} />;
    }
  })();

  // Wrap component based on route's public flag
  return route.public ? (
    <PublicRoute>{Component}</PublicRoute>
  ) : (
    <ProtectedRoute>{Component}</ProtectedRoute>
  );
};

const App = () => {
  const [theme, setTheme] = useState('light');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('authToken');
  });

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const handleAuthStateChange = (authState) => {
    setIsAuthenticated(authState);
  };

  return (
    <ConfigProvider theme={{ mode: theme }}>
      <Router>
        <div className={`app ${theme}`}>
          {isAuthenticated && (
            <button onClick={toggleTheme} className="theme-toggle">
              Toggle Theme
            </button>
          )}
          <Routes>
            {routesConfig.routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <PageBuilder 
                    route={route} 
                    onAuthStateChange={handleAuthStateChange}
                  />
                }
              />
            ))}
            <Route 
              path="*" 
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
};

// PropTypes
PageBuilder.propTypes = {
  route: PropTypes.shape({
    path: PropTypes.string.isRequired,
    componentConfig: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['auth', 'dashboard', 'report', 'settings', 'profile', 'management']).isRequired,
    mainPage: PropTypes.bool,
    sections: PropTypes.arrayOf(PropTypes.string),
    public: PropTypes.bool.isRequired
  }).isRequired,
  onAuthStateChange: PropTypes.func.isRequired
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired
};

export default App;