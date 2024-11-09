export const loadConfig = async (path) => {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${path}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading config: ${path}`, error);
      return null;
    }
  };
  
  export const loadAllConfigs = async () => {
    try {
      const [app, theme, layout] = await Promise.all([
        loadConfig('/config/app.json'),
        loadConfig('/config/theme.json'),
        loadConfig('/config/layout.json')
      ]);
  
      return {
        app,
        theme,
        layout
      };
    } catch (error) {
      console.error('Error loading configurations:', error);
      return null;
    }
  };