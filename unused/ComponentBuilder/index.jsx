// frontend/src/builders/ComponentBuilder/index.jsx
import React from 'react';
import * as Antd from 'antd';
import * as Icons from '@ant-design/icons';
import { useConfig } from '@/contexts/ConfigContext';
import { createComponent } from './createComponent';
import { processProps } from './processors';
import { useComponentHooks } from './hooks';

const ComponentBuilder = ({
  type,
  config = {},
  pageConfig = {},
  parentProps = {}
}) => {
  const { components } = useConfig();
  const [namespace, componentName] = (config.extends || type).split('.');
  
  // Get base component configuration
  const getBaseConfig = () => {
    const baseComponent = components?.[namespace]?.[componentName];
    if (!baseComponent) {
      console.warn(`Component ${namespace}.${componentName} not found`);
      return null;
    }
    return baseComponent;
  };

  // Merge configurations
  const mergeConfigs = (baseConfig) => {
    return {
      ...baseConfig,
      ...config,
      props: {
        ...baseConfig?.defaultProps,
        ...config.props
      }
    };
  };

  // Build the component
  const buildComponent = () => {
    const baseConfig = getBaseConfig();
    if (!baseConfig) return null;

    const finalConfig = mergeConfigs(baseConfig);
    const {
      extends: baseComponent,
      variant,
      props = {},
      fields = [],
      features = {},
      composition = [],
      hooks: hookConfig = {}
    } = finalConfig;

    // Handle component composition
    if (composition.length > 0) {
      return buildCompositeComponent(composition, finalConfig);
    }

    // Get component from Antd or custom components
    const Component = baseComponent.startsWith('antd.') 
      ? Antd[baseComponent.replace('antd.', '')]
      : null;

    if (!Component) {
      console.warn(`Component ${baseComponent} not found`);
      return null;
    }

    // Process hooks
    const hooks = useComponentHooks(hookConfig, finalConfig);

    // Process props and features
    const processedProps = processProps(props, {
      pageConfig,
      parentProps,
      features,
      hooks,
      variant
    });

    // Build fields for form components
    if (fields.length > 0) {
      return buildFormComponent(Component, fields, processedProps);
    }

    return createComponent({
      Component,
      props: processedProps,
      variant,
      features,
      hooks
    });
  };

  return buildComponent();
};

export default ComponentBuilder;

// frontend/src/builders/ComponentBuilder/processors.js




export const buildFormComponent = (FormComponent, fields, props) => {
  const formFields = fields.map((field, index) => (
    <FormComponent.Item
      key={index}
      {...field}
    >
      <ComponentBuilder
        type={field.component}
        config={field}
      />
    </FormComponent.Item>
  ));

  return (
    <FormComponent {...props}>
      {formFields}
    </FormComponent>
  );
};

// Example usage:
const ExampleUsage = () => {
  return (
    <ComponentBuilder
      type="base.Form"
      config={{
        variant: "default",
        props: {
          layout: "vertical",
          onFinish: (values) => console.log(values)
        },
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
            options: [
              { label: "Type A", value: "a" },
              { label: "Type B", value: "b" }
            ]
          }
        ]
      }}
    />
  );
};