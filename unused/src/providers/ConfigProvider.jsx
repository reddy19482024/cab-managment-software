import React, { createContext, useState, useEffect } from 'react';
import { message } from 'antd';
import { configLoader, CONFIG_ERROR_TYPES } from '../config/loader';

// Export ConfigContext so it can be used by useConfig hook
export const ConfigContext = createContext(null);

export const ConfigProvider = ({ children }) => {
  const [state, setState] = useState({
    config: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const configs = await configLoader.loadAllConfigs();
        configLoader.validateConfigs();
        
        setState({
          config: configs,
          loading: false,
          error: null
        });
      } catch (error) {
        let errorMessage = 'Configuration error occurred';

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

        message.error(errorMessage);
        setState({
          config: null,
          loading: false,
          error: error
        });

        console.error('Configuration Error:', {
          type: error.type,
          message: error.message,
          details: error.details
        });
      }
    };

    loadConfigs();
  }, []);

  if (state.loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        Loading configurations...
      </div>
    );
  }

  if (state.error) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '20px'
      }}>
        <h1>Configuration Error</h1>
        <p>{state.error.message}</p>
        {process.env.NODE_ENV === 'development' && (
          <pre>{JSON.stringify(state.error.details, null, 2)}</pre>
        )}
        <button 
          onClick={() => window.location.reload()}
          style={{ marginTop: '20px' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ConfigContext.Provider value={state.config}>
      {children}
    </ConfigContext.Provider>
  );
};