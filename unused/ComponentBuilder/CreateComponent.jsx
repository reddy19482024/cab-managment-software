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