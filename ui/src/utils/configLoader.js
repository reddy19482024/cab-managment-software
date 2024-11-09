// src/utils/configLoader.js
export default async function configLoader(configName) {
  try {
    // Import all JSON configs
    const allConfigs = import.meta.glob('/src/config/*.json', { 
      eager: true,
      import: 'default'
    });

    // Try to load routes first
    const routesPath = '/src/config/routes.json';
    const routes = allConfigs[routesPath];

    if (!routes) {
      throw new Error('Routes configuration not found');
    }

    // Check if we're looking for a component config
    const componentRoute = routes.routes.find(
      route => route.componentConfig === configName
    );

    if (componentRoute) {
      // Look for exact match first
      const exactConfigPath = `/src/config/${configName}.json`;
      if (allConfigs[exactConfigPath]) {
        return allConfigs[exactConfigPath];
      }

      // If no exact match, try with lowercase
      const lowerConfigPath = `/src/config/${configName.toLowerCase()}.json`;
      if (allConfigs[lowerConfigPath]) {
        return allConfigs[lowerConfigPath];
      }

      // Try the transformed version as a fallback
      const configFileName = configName
        .replace(/([A-Z])/g, (match, letter, offset) => 
          offset > 0 ? `-${letter.toLowerCase()}` : letter.toLowerCase())
        .replace('-page', '');

      const transformedPath = `/src/config/${configFileName}.json`;
      if (allConfigs[transformedPath]) {
        return allConfigs[transformedPath];
      }
    }

    // If not a component config, try direct file access
    const directPath = `/src/config/${configName.toLowerCase()}.json`;
    if (allConfigs[directPath]) {
      return allConfigs[directPath];
    }

    // If still not found, provide helpful error message with available configs
    const availableConfigs = Object.keys(allConfigs)
      .map(path => path.split('/').pop()?.replace('.json', ''))
      .filter(Boolean)
      .join(', ');

    throw new Error(
      `Configuration "${configName}" not found. Available configs: ${availableConfigs}`
    );

  } catch (error) {
    console.error('Error loading config:', error.message);
    throw error;
  }
}