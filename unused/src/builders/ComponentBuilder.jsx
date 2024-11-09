// src/builders/ComponentBuilder.js
import React from 'react';
import * as Antd from 'antd';
import * as Icons from '@ant-design/icons';
import { useApi } from '../hooks/useApi';
import { useConfig } from '../hooks/useConfig';

const ComponentBuilder = ({ 
  config,
  pageConfig,
  parentProps = {} 
}) => {
  const api = useApi();
  const { components: globalComponents } = useConfig();
  
  if (!config) return null;

  // Get component based on type
  const getComponent = () => {
    const { type } = config;

    // Handle Ant Design components
    if (type.startsWith('antd.')) {
      const componentName = type.split('.')[1];
      return Antd[componentName];
    }

    // Handle Ant Design icons
    if (type.startsWith('icon.')) {
      const iconName = type.split('.')[1];
      return Icons[iconName];
    }

    // Handle global components from config
    if (globalComponents?.[type]) {
      return globalComponents[type];
    }

    console.warn(`Component type not found: ${type}`);
    return null;
  };

  // Process component props
  const processProps = () => {
    const { props = {}, events = {}, style } = config;

    // Process event handlers
    const eventHandlers = Object.entries(events).reduce((acc, [key, handler]) => {
      if (typeof handler === 'function') {
        acc[key] = handler;
      } else if (typeof handler === 'string' && pageConfig?.actions?.[handler]) {
        acc[key] = (...args) => pageConfig.actions[handler](...args);
      }
      return acc;
    }, {});

    // Merge all props
    return {
      ...parentProps,
      ...props,
      ...eventHandlers,
      style: {
        ...parentProps.style,
        ...style
      }
    };
  };

  // Handle data fetching
  const withData = (WrappedComponent) => {
    const DataWrapper = (props) => {
      const [data, setData] = React.useState(null);
      const [loading, setLoading] = React.useState(false);

      React.useEffect(() => {
        const fetchData = async () => {
          if (!config.api) return;

          setLoading(true);
          try {
            const response = await api.request(config.api);
            setData(response);
          } catch (error) {
            console.error('Failed to fetch component data:', error);
          } finally {
            setLoading(false);
          }
        };

        fetchData();
      }, [config.api?.url]);

      if (loading) {
        return <Antd.Spin />;
      }

      return <WrappedComponent {...props} data={data} />;
    };

    return DataWrapper;
  };

  // Build component
  const buildComponent = () => {
    const Component = getComponent();
    if (!Component) return null;

    const props = processProps();

    // Handle components that need data
    if (config.api) {
      const WrappedComponent = withData(Component);
      return <WrappedComponent {...props} />;
    }

    // Handle components with children
    if (config.children) {
      return (
        <Component {...props}>
          {Array.isArray(config.children) 
            ? config.children.map((child, index) => (
                <ComponentBuilder
                  key={index}
                  config={child}
                  pageConfig={pageConfig}
                />
              ))
            : config.children
          }
        </Component>
      );
    }

    return <Component {...props} />;
  };

  return buildComponent();
};

export default ComponentBuilder;