import React from 'react';
import { Layout } from 'antd';

export const renderLayout = (layoutConfig, pageConfig) => {
  const { sections } = pageConfig;

  return (
    <Layout className={layoutConfig.container || ''}>
      {sections.map((section, idx) => (
        <div key={idx} className={section.styles || ''}>
          {renderComponent(section.component)}
        </div>
      ))}
    </Layout>
  );
};

export const renderComponent = (componentConfig) => {
  const { type, props, styles } = componentConfig;

  switch (type) {
    case 'Input':
      return <input className={`${styles} ${props.className}`} {...props} />;
    case 'Button':
      return <button className={`${styles} ${props.className}`} {...props}>{props.text}</button>;
    default:
      return null;
  }
};
