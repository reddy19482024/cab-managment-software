import React, { createContext, useContext, useEffect, useState } from 'react';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);

  const loadConfig = async () => {
    try {
      // Import static configurations
      const app = await import('@config/app.json');
      const theme = await import('@config/theme.json');
      const components = await import('@config/components.json');
      const layout = await import('@config/layout.json');

      // Dynamically import all JSON files from `pages` and `api` folders
      const pageModules = import.meta.glob('/Users/prasadreddy/Desktop/apps/cab-managment-software/config/pages/*.json', { eager: true });
      const apiModules = import.meta.glob('/Users/prasadreddy/Desktop/apps/cab-managment-software/config/api/*.json', { eager: true });

      // Process imported modules to build config structure
      const pages = Object.entries(pageModules).reduce((acc, [path, module]) => {
        const pageName = path.split('/').pop().replace('.json', '');
        acc[pageName] = module.default;
        return acc;
      }, {});

      const api = Object.entries(apiModules).reduce((acc, [path, module]) => {
        const apiName = path.split('/').pop().replace('.json', '');
        acc[apiName] = module.default;
        return acc;
      }, {});

      setConfig({ app: app.default, theme: theme.default, components: components.default, layout: layout.default, pages, api });
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
};

export const useConfig = () => useContext(ConfigContext);
