// frontend/src/contexts/ConfigContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import appConfig from '../../config/app.json';
import themeConfig from '../../config/theme.json';
import layoutConfig from '../../config/layout.json';

const ConfigContext = createContext({});

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    app: null,
    theme: null,
    layouts: null,
    pages: {}
  });

  useEffect(() => {
    async function loadConfigs() {
      try {
        // Load page configs dynamically
        const pageModules = import.meta.glob('../../../config/pages/*.json');
        const pageConfigs = {};
        
        for (const path in pageModules) {
          const module = await pageModules[path]();
          const pageName = path.split('/').pop().replace('.json', '');
          pageConfigs[pageName] = module.default;
        }

        setConfig({
          app: appConfig,
          theme: themeConfig,
          layouts: layoutConfig,
          pages: pageConfigs
        });
      } catch (error) {
        console.error('Error loading configurations:', error);
      }
    }

    loadConfigs();
  }, []);

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);