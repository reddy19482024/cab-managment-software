// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import DynamicPage from './components/DynamicPage/DynamicPage';
import routesConfig from './config/routes.json';  // Directly import routes configuration

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
                element={<DynamicPage configName={route.componentConfig} />}
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
