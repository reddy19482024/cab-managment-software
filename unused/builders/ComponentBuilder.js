// frontend/src/builders/ComponentBuilder.js
import React from 'react';
import * as Antd from 'antd';
import * as Icons from '@ant-design/icons';
import { useConfig } from '@/contexts/ConfigContext';

const ComponentBuilder = ({ 
  type,
  config = {},
  pageConfig,
  parentProps = {} 
}) => {
  const { config: { components } } = useConfig();
  
  // Get component configuration from components.json
  const getComponentConfig = () => {
    // Split type into namespace and component name (e.g., "base.Form" -> ["base", "Form"])
    const [namespace, componentName] = type.split('.');
    
    // Get base component configuration
    const baseConfig = components?.[namespace]?.[componentName];
    if (!baseConfig) {
      console.warn(`Component ${type} not found in components config`);
      return null;
    }

    // If component extends another, get the extended component
    if (baseConfig.extends) {
      const [extNamespace, extComponent] = baseConfig.extends.split('.');
      const Component = extNamespace === 'antd' ? Antd[extComponent] : null;
      
      return {
        Component,
        config: {
          ...baseConfig,
          ...config,
          props: {
            ...baseConfig.defaultProps,
            ...config.props
          }
        }
      };
    }

    return { config: baseConfig };
  };

  // Process component features
  const processFeatures = (features = {}, componentConfig) => {
    return Object.entries(features).reduce((acc, [key, value]) => {
      switch (key) {
        case 'selection':
          if (value.enabled) {
            acc.rowSelection = {
              type: value.type
            };
          }
          break;
        case 'pagination':
          acc.pagination = value;
          break;
        case 'sorting':
          acc.sortable = value.enabled;
          break;
        // Add more feature processors as needed
      }
      return acc;
    }, {});
  };

  // Build form fields if component is a form
  const buildFormFields = (fields, fieldConfig) => {
    return fields.map((field) => {
      const fieldType = field.component || field.type;
      return (
        <Antd.Form.Item
          key={field.name}
          name={field.name}
          label={field.label}
          rules={field.rules}
          {...field.formItemProps}
        >
          <ComponentBuilder
            type={fieldType}
            config={field}
            pageConfig={pageConfig}
          />
        </Antd.Form.Item>
      );
    });
  };

  // Build the component
  const buildComponent = () => {
    const componentData = getComponentConfig();
    if (!componentData) return null;

    const { Component, config: componentConfig } = componentData;
    const {
      variant,
      fields = [],
      features = {},
      props = {},
      events = {},
      children: configChildren
    } = componentConfig;

    // Process final props
    const finalProps = {
      ...props,
      ...processFeatures(features, componentConfig),
      ...events,
      style: componentConfig.styles
    };

    // Handle form components
    if (fields.length > 0) {
      return (
        <Component {...finalProps}>
          {buildFormFields(fields, componentConfig)}
          {configChildren}
        </Component>
      );
    }

    // Handle components with children
    if (configChildren) {
      if (Array.isArray(configChildren)) {
        return (
          <Component {...finalProps}>
            {configChildren.map((child, index) => (
              <ComponentBuilder
                key={index}
                type={child.type}
                config={child}
                pageConfig={pageConfig}
                parentProps={finalProps}
              />
            ))}
          </Component>
        );
      }

      return (
        <Component {...finalProps}>
          {configChildren}
        </Component>
      );
    }

    // Handle basic components
    return <Component {...finalProps} />;
  };

  return buildComponent();
};

export default ComponentBuilder;

// Example usage in a page:
/*
<ComponentBuilder
  type="base.Form"
  config={{
    variant: "default",
    fields: [
      {
        name: "username",
        component: "Input",
        label: "Username",
        rules: [{ required: true }]
      },
      {
        name: "type",
        component: "Select",
        label: "Type",
        props: {
          options: [
            { label: "Type A", value: "a" },
            { label: "Type B", value: "b" }
          ]
        }
      }
    ],
    buttons: [
      {
        type: "base.Button",
        props: {
          type: "primary",
          htmlType: "submit",
          text: "Submit"
        }
      }
    ]
  }}
  pageConfig={{
    api: {
      submit: "users.create"
    }
  }}
/>
*/