// frontend/src/builders/LayoutBuilder/index.jsx
import React from 'react';
import { Layout } from 'antd';
import { useConfig } from '@/contexts/ConfigContext';
import { useTheme } from '@/services/theme';
import { processStyles, processConfig } from './processors';
import ComponentBuilder from '../../src/builders/ComponentBuilder';

const { Header, Content, Sider, Footer } = Layout;

const LayoutBuilder = ({ type, children }) => {
  const { config } = useConfig();
  const theme = useTheme();
  const layoutConfig = config?.layouts?.types?.[type];

  if (!layoutConfig) {
    console.error(`Layout type not found: ${type}`);
    return <div>{children}</div>;
  }

  const { template, config: layoutSettings } = layoutConfig;

  // Build layout component based on template
  const buildLayoutComponent = () => {
    switch (template) {
      case 'AuthLayout':
        return buildAuthLayout();
      case 'DefaultLayout':
        return buildDefaultLayout();
      case 'MapLayout':
        return buildMapLayout();
      default:
        return children;
    }
  };

  // Build layout section component
  const buildLayoutSection = (type, config = {}, components = []) => {
    const sectionConfig = processConfig(config, theme);
    
    switch (type) {
      case 'header':
        return (
          <Header
            style={{
              height: sectionConfig.height,
              background: sectionConfig.background,
              boxShadow: sectionConfig.boxShadow,
              position: sectionConfig.fixed ? 'fixed' : 'relative',
              width: '100%',
              zIndex: sectionConfig.fixed ? 1000 : undefined,
              ...sectionConfig.styles
            }}
          >
            {components.map((componentName, index) => (
              <ComponentBuilder
                key={index}
                type={componentName}
                config={config.layouts?.components?.[componentName]}
              />
            ))}
          </Header>
        );

      case 'sidebar':
        return (
          <Sider
            width={sectionConfig.width}
            collapsible={sectionConfig.collapsible}
            collapsed={sectionConfig.defaultCollapsed}
            theme={sectionConfig.theme || 'light'}
            style={{
              background: sectionConfig.background,
              borderRight: sectionConfig.borderRight,
              boxShadow: sectionConfig.boxShadow,
              ...sectionConfig.styles
            }}
          >
            {components.map((componentName, index) => (
              <ComponentBuilder
                key={index}
                type={componentName}
                config={config.layouts?.components?.[componentName]}
              />
            ))}
          </Sider>
        );

      case 'content':
        return (
          <Content
            style={{
              padding: sectionConfig.padding,
              background: sectionConfig.background,
              ...sectionConfig.styles
            }}
          >
            {children}
          </Content>
        );

      case 'footer':
        return (
          <Footer
            style={{
              height: sectionConfig.height,
              background: sectionConfig.background,
              borderTop: sectionConfig.borderTop,
              ...sectionConfig.styles
            }}
          >
            {components.map((componentName, index) => (
              <ComponentBuilder
                key={index}
                type={componentName}
                config={config.layouts?.components?.[componentName]}
              />
            ))}
          </Footer>
        );

      default:
        return null;
    }
  };

  // Build auth layout
  const buildAuthLayout = () => {
    const styles = processStyles(layoutSettings.styles, theme);

    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          {layoutSettings.sections?.map(section => 
            buildLayoutSection(section, layoutSettings)
          )}
        </div>
      </div>
    );
  };

  // Build default layout
  const buildDefaultLayout = () => {
    return (
      <Layout>
        {buildLayoutSection('header', layoutSettings.header, layoutSettings.header.components)}
        <Layout>
          {buildLayoutSection('sidebar', layoutSettings.sidebar, layoutSettings.sidebar.components)}
          {buildLayoutSection('content', layoutSettings.content)}
          {buildLayoutSection('footer', layoutSettings.footer, layoutSettings.footer.components)}
        </Layout>
      </Layout>
    );
  };

  // Build map layout
  const buildMapLayout = () => {
    return (
      <Layout>
        {buildLayoutSection('header', layoutSettings.header)}
        <Layout>
          {buildLayoutSection('content', layoutSettings.content)}
          {layoutSettings.sidebar.position === 'right' && 
            buildLayoutSection('sidebar', layoutSettings.sidebar)}
        </Layout>
      </Layout>
    );
  };

  return buildLayoutComponent();
};




// Export other layout components similarly