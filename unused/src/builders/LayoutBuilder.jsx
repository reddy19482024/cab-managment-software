import React from 'react';
import { Layout } from 'antd';
import { useConfig } from '../hooks/useConfig';
import ComponentBuilder from './ComponentBuilder';

const { Header, Content, Sider, Footer } = Layout;

const LayoutBuilder = ({ type, children }) => {
  const { layouts } = useConfig();

  // Get layout configuration
  const layoutConfig = layouts?.[type];
  if (!layoutConfig) {
    console.warn(`Layout type ${type} not found, using default`);
    return <div>{children}</div>;
  }

  // Process layout styles with theme
  const processStyle = (styles = {}) => {
    return styles;
  };

  // Build header section
  const buildHeader = () => {
    const { header } = layoutConfig;
    if (!header) return null;

    return (
      <Header style={processStyle(header.style)}>
        {header.components?.map((component, index) => (
          <ComponentBuilder
            key={index}
            config={component}
          />
        ))}
      </Header>
    );
  };

  // Build sider section
  const buildSider = () => {
    const { sider } = layoutConfig;
    if (!sider) return null;

    return (
      <Sider
        width={sider.width}
        collapsible={sider.collapsible}
        collapsed={sider.defaultCollapsed}
        style={processStyle(sider.style)}
      >
        {sider.components?.map((component, index) => (
          <ComponentBuilder
            key={index}
            config={component}
          />
        ))}
      </Sider>
    );
  };

  // Build footer section
  const buildFooter = () => {
    const { footer } = layoutConfig;
    if (!footer) return null;

    return (
      <Footer style={processStyle(footer.style)}>
        {footer.components?.map((component, index) => (
          <ComponentBuilder
            key={index}
            config={component}
          />
        ))}
      </Footer>
    );
  };

  // Build complete layout
  return (
    <Layout style={processStyle(layoutConfig.style)}>
      {buildHeader()}
      <Layout>
        {layoutConfig.sider?.position === 'left' && buildSider()}
        <Content style={processStyle(layoutConfig.content?.style)}>
          {children}
        </Content>
        {layoutConfig.sider?.position === 'right' && buildSider()}
      </Layout>
      {buildFooter()}
    </Layout>
  );
};

export default LayoutBuilder;