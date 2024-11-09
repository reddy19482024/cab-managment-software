import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import { configLoader, CONFIG_ERROR_TYPES } from '../config/loader';

const ConfigContext = createContext(null);

export const ConfigProvider = ({ children }) => {
  const [state, setState] = useState({
    config: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadAndValidateConfigs = async () => {
      try {
        // Load all configurations
        const configs = await configLoader.loadAllConfigs();
        configLoader.validateConfigs(configs); // Pass configs to validateConfigs

        setState({
          config: configs,
          loading: false,
          error: null
        });
      } catch (error) {
        // Error handling based on CONFIG_ERROR_TYPES
        let errorMessage = 'Configuration error occurred';

        if (error instanceof Error && error.type) {
          switch (error.type) {
            case CONFIG_ERROR_TYPES.LOAD_ERROR:
              errorMessage = 'Failed to load configurations';
              break;
            case CONFIG_ERROR_TYPES.VALIDATION_ERROR:
              errorMessage = `Configuration validation failed: ${error.message}`;
              break;
            case CONFIG_ERROR_TYPES.NOT_FOUND:
              errorMessage = 'Required configurations not found';
              break;
            default:
              errorMessage = 'Unknown configuration error';
          }
        }

        // Display error message and set error state
        message.error(errorMessage);
        setState({
          config: null,
          loading: false,
          error: error
        });
      }
    };

    loadAndValidateConfigs();
  }, []);

  // Render loading state
  if (state.loading) {
    return <div>Loading configurations...</div>;
  }

  // Render error state
  if (state.error) {
    return <div>Error loading configurations: {state.error.message}</div>;
  }

  // Render children within context provider if configs loaded successfully
  return (
    <ConfigContext.Provider value={state.config}>
      {children}
    </ConfigContext.Provider>
  );
};

// Custom hook to use Config context
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
};
