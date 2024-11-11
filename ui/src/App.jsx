import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import DynamicPage from './components/DynamicPage/DynamicPage';
import ReportPageBuilder from './components/ReportPageBuilder/ReportPageBuilder';
import SettingsPage from './components/SettingsPage/SettingsPage';
import ProfilePage from './components/ProfilePage/ProfilePage';
import routesConfig from './config/routes.json';

const PageBuilder = ({ route }) => {
  switch (route.type) {
    case 'dashboard':
    case 'report':
      return <ReportPageBuilder configName={route.componentConfig} />;
      
    case 'settings':
      return <SettingsPage configName={route.componentConfig} />;
      
    case 'profile':
      return <ProfilePage configName={route.componentConfig} />;
      
    case 'auth':
    case 'management':
    default:
      return <DynamicPage configName={route.componentConfig} />;
  }
};

const App = () => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ConfigProvider theme={{ mode: theme }}>
      <Router>
        <div className={`app ${theme}`}>
          <button onClick={toggleTheme} className="theme-toggle">Toggle Theme</button>
          <Routes>
            {routesConfig.routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<PageBuilder route={route} />}
              />
            ))}
            <Route path="*" element={<div>404 - Page Not Found</div>} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
};

export default App;