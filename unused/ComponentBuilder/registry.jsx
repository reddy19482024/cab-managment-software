import * as AntD from 'antd';
import * as Icons from '@ant-design/icons';
import * as BaseComponents from '@/components/base';
import * as PatternComponents from '@/components/patterns';
import * as FormComponents from '@/components/forms';
import * as DataComponents from '@/components/data';

class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    // Register Antd components
    Object.entries(AntD).forEach(([name, component]) => {
      this.register(`antd.${name}`, component);
    });

    // Register Icons
    Object.entries(Icons).forEach(([name, component]) => {
      this.register(`icon.${name}`, component);
    });

    // Register base components
    Object.entries(BaseComponents).forEach(([name, component]) => {
      this.register(`base.${name}`, component);
    });

    // Register pattern components
    Object.entries(PatternComponents).forEach(([name, component]) => {
      this.register(`pattern.${name}`, component);
    });

    // Register form components
    Object.entries(FormComponents).forEach(([name, component]) => {
      this.register(`form.${name}`, component);
    });

    // Register data components
    Object.entries(DataComponents).forEach(([name, component]) => {
      this.register(`data.${name}`, component);
    });
  }

  register(name, component) {
    this.components.set(name, component);
  }

  get(name) {
    return this.components.get(name);
  }

  has(name) {
    return this.components.has(name);
  }
}

export const componentRegistry = new ComponentRegistry();


// frontend/src/builders/ComponentBuilder/createComponent.js
import React from 'react';

export const createComponent = ({
  Component,
  props,
  events,
  styles,
  children,
  config
}) => {
  // Merge all props
  const componentProps = {
    ...props,
    ...events,
    style: styles,
    ...config
  };

  // Handle children
  const renderChildren = () => {
    if (!children) return null;
    
    if (Array.isArray(children)) {
      return children.map((child, index) => (
        <ComponentBuilder
          key={index}
          {...child}
          parentProps={componentProps}
        />
      ));
    }

    if (typeof children === 'object') {
      return <ComponentBuilder {...children} parentProps={componentProps} />;
    }

    return children;
  };

  return <Component {...componentProps}>{renderChildren()}</Component>;
};

// Example usage in configuration:
const exampleConfig = {
  "components": {
    "userForm": {
      "extends": "form.Form",
      "variant": "default",
      "props": {
        "layout": "vertical",
        "initialValues": "${defaultValues}"
      },
      "events": {
        "submit": "handleSubmit",
        "change": "handleChange"
      },
      "children": [
        {
          "extends": "form.Input",
          "props": {
            "name": "username",
            "label": "Username",
            "rules": [{ "required": true }]
          }
        },
        {
          "extends": "base.Button",
          "props": {
            "type": "primary",
            "htmlType": "submit",
            "text": "Submit"
          }
        }
      ]
    }
  }
};