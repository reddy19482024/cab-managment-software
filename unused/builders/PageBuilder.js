// frontend/src/builders/PageBuilder.js
import React, { Suspense } from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import LayoutBuilder from './LayoutBuilder';
import ComponentBuilder from './ComponentBuilder';
import { useApi } from '@/services/api';
import { message } from 'antd';

const PageBuilder = ({ pageKey }) => {
  const { config } = useConfig();
  const api = useApi();
  
  // Get page configuration
  const pageConfig = config.pages?.[pageKey]?.page;
  if (!pageConfig) {
    console.error(`Page configuration not found for: ${pageKey}`);
    return null;
  }

  // Build component from config
  const buildComponent = (componentKey, componentConfig) => {
    if (!componentConfig) {
      console.warn(`Component config not found for: ${componentKey}`);
      return null;
    }

    return (
      <ComponentBuilder
        key={componentKey}
        type={componentConfig.extends || componentConfig.component}
        config={componentConfig}
        pageConfig={pageConfig}
      />
    );
  };

  // Build section content
  const buildSection = (section) => {
    const {
      id,
      component,
      components: sectionComponents = [],
      config: sectionConfig = {},
      styles = {}
    } = section;

    // If section uses a single component
    if (component) {
      const componentConfig = pageConfig.components?.[component];
      return buildComponent(id, { ...componentConfig, styles });
    }

    // If section has multiple components
    const sectionStyle = {
      ...styles,
      display: sectionConfig.grid ? 'grid' : 'block',
      gridTemplateColumns: sectionConfig.grid?.columns ? 
        `repeat(${sectionConfig.grid.columns}, 1fr)` : undefined,
      gap: sectionConfig.grid?.gap || undefined
    };

    return (
      <div key={id} style={sectionStyle}>
        {sectionComponents.map((componentKey) => {
          const componentConfig = pageConfig.components?.[componentKey];
          return buildComponent(componentKey, componentConfig);
        })}
      </div>
    );
  };

  // Handle page actions
  const handleAction = async (actionKey, params = {}) => {
    const action = pageConfig.actions?.[actionKey];
    if (!action) {
      console.warn(`Action not found: ${actionKey}`);
      return;
    }

    try {
      switch (action.type) {
        case 'api':
          const response = await api[action.api](params);
          if (action.onSuccess) {
            const { type, message: msg } = action.onSuccess;
            message[type](msg);
          }
          return response;

        case 'navigation':
          // Handle navigation
          break;

        case 'modal':
          // Handle modal actions
          break;

        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      if (action.onError) {
        const { type, message: msg } = action.onError;
        message[type](msg || error.message);
      }
      throw error;
    }
  };

  // Build page content
  const buildPage = () => {
    const { sections = [], styles = {} } = pageConfig;

    return (
      <div style={styles.container}>
        <div style={styles.content}>
          {sections.map((section) => buildSection(section))}
        </div>
      </div>
    );
  };

  return (
    <Suspense fallback="Loading...">
      <LayoutBuilder type={pageConfig.layout}>
        {buildPage()}
      </LayoutBuilder>
    </Suspense>
  );
};

export default PageBuilder;

