import { defineConfig } from 'vite';

const BASE_CONFIG_PATH = '../../../config'; // Path to config folder

class ConfigError extends Error {
  constructor(type, message, details) {
    super(message);
    this.type = type;
    this.details = details;
  }
}

class ConfigLoader {
  async loadAllConfigs() {
    try {
      // Load core configurations
      const [app, theme, layout, components] = await Promise.all([
        this.loadJson(`${BASE_CONFIG_PATH}/app.json`),
        this.loadJson(`${BASE_CONFIG_PATH}/theme.json`),
        this.loadJson(`${BASE_CONFIG_PATH}/layout.json`),
        this.loadJson(`${BASE_CONFIG_PATH}/components.json`)
      ]);

      // Load page configurations
      const pageModules = import.meta.glob(`${BASE_CONFIG_PATH}/pages/*.json`, { eager: true });
      const pages = this.loadModules(pageModules);

      // Load API configurations
      const apiModules = import.meta.glob(`${BASE_CONFIG_PATH}/api/*.json`, { eager: true });
      const api = this.loadModules(apiModules);

      return {
        app,
        theme,
        layout,
        components,
        pages,
        api
      };
    } catch (error) {
      console.error('Config loading error:', error);
      throw new ConfigError('LOAD_ERROR', 'Failed to load configurations', error.message);
    }
  }

  async loadJson(path) {
    try {
      const module = await import(/* @vite-ignore */ path);
      return module.default;
    } catch (error) {
      console.error(`Failed to load ${path}:`, error);
      throw new ConfigError('LOAD_ERROR', `Failed to load ${path}`, error.message);
    }
  }

  loadModules(modules) {
    return Object.entries(modules).reduce((acc, [path, module]) => {
      const name = path.split('/').pop().replace('.json', '');
      acc[name] = module.default;
      return acc;
    }, {});
  }

  validateConfigs(configs) {
    const requiredConfigs = ['app', 'theme', 'layout'];
    const missingConfigs = requiredConfigs.filter(key => !configs?.[key]);

    if (missingConfigs.length > 0) {
      throw new ConfigError(
        'VALIDATION_ERROR',
        `Missing required configurations: ${missingConfigs.join(', ')}`,
        'Check if all required configuration files exist and are properly formatted'
      );
    }

    return true;
  }
}

// Create and export a singleton instance
const configLoader = new ConfigLoader();
export { configLoader, ConfigError };
