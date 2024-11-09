// frontend/src/builders/LayoutBuilder.js
import React from 'react';
import { Layout } from 'antd';
import { useConfig } from '@/contexts/ConfigContext';
import ComponentBuilder from './ComponentBuilder';

const { Header, Content, Sider, Footer } = Layout;

const LayoutBuilder = ({ type, children }) => {
  const { config } = useConfig();
  const layoutConfig = config?.layouts?.types?.[type];

  if (!layoutConfig) {
    console.error(`Layout type ${type} not found in config`);
    return <div>{children}</div>;
  }

  // Get layout components defined in config
  const getLayoutComponent = (componentName) => {
    const componentConfig = config?.layouts?.components?.[componentName];
    if (!componentConfig) return null;

    return (
      <ComponentBuilder
        key={componentName}
        type={componentName}
        config={componentConfig}
      />
    );
  };

  // Process styles and variables from theme
  const processStyle = (styleConfig = {}) => {
    return Object.entries(styleConfig).reduce((acc, [key, value]) => {
      // Handle theme variables ${theme.xxx}
      if (typeof value === 'string' && value.includes('${theme.')) {
        const themeKey = value.match(/\${theme\.(.*?)}/)[1];
        acc[key] = config.theme[themeKey];
      } else if (typeof value === 'string' && value.includes('${app.')) {
        // Handle app variables ${app.xxx}
        const appKey = value.match(/\${app\.(.*?)}/)[1];
        acc[key] = config.app[appKey];
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});
  };

  // Build layout based on template
  const buildLayout = () => {
    const { template, config: templateConfig } = layoutConfig;

    switch (template) {
      case 'AuthLayout':
        return buildAuthLayout(templateConfig);
      case 'DefaultLayout':
        return buildDefaultLayout(templateConfig);
      case 'MapLayout':
        return buildMapLayout(templateConfig);
      default:
        return <div>{children}</div>;
    }
  };

  // Build auth layout
  const buildAuthLayout = (config) => {
    const styles = processStyle(config.styles);

    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          {config.sections?.map(section => {
            switch (section) {
              case 'header':
                return <div key="header" style={processStyle(config.header?.styles)}>
                  {config.header?.components?.map(getLayoutComponent)}
                </div>;
              case 'content':
                return <div key="content" style={processStyle(config.content?.styles)}>
                  {children}
                </div>;
              case 'footer':
                return <div key="footer" style={processStyle(config.footer?.styles)}>
                  {config.footer?.components?.map(getLayoutComponent)}
                </div>;
              default:
                return null;
            }
          })}
        </div>
      </div>
    );
  };

  // Build default layout
  const buildDefaultLayout = (config) => {
    return (
      <Layout>
        <Header 
          style={processStyle({
            height: config.header?.height,
            background: config.header?.background,
            boxShadow: config.header?.boxShadow,
            position: config.header?.fixed ? 'fixed' : 'relative',
            width: '100%',
            zIndex: config.header?.fixed ? 1000 : undefined
          })}
        >
          {config.header?.components?.map(getLayoutComponent)}
        </Header>
        <Layout>
          {config.sidebar && (
            <Sider
              width={config.sidebar.width}
              collapsible={config.sidebar.collapsible}
              style={processStyle({
                background: config.sidebar.background,
                borderRight: config.sidebar.borderRight
              })}
            >
              {config.sidebar?.components?.map(getLayoutComponent)}
            </Sider>
          )}
          <Content
            style={processStyle({
              padding: config.content?.padding,
              background: config.content?.background
            })}
          >
            {children}
          </Content>
        </Layout>
        {config.footer && (
          <Footer
            style={processStyle({
              height: config.footer.height,
              background: config.footer.background,
              borderTop: config.footer.borderTop
            })}
          >
            {config.footer?.components?.map(getLayoutComponent)}
          </Footer>
        )}
      </Layout>
    );
  };

  // Build map layout
  const buildMapLayout = (config) => {
    return (
      <Layout>
        <Header
          style={processStyle({
            height: config.header?.height,
            position: config.header?.fixed ? 'fixed' : 'relative',
            width: '100%',
            zIndex: config.header?.fixed ? 1000 : undefined
          })}
        >
          {config.header?.components?.map(getLayoutComponent)}
        </Header>
        <Layout>
          <Content style={{ height: 'calc(100vh - 64px)' }}>
            {children}
          </Content>
          {config.sidebar && (
            <Sider
              width={config.sidebar.width}
              collapsible={config.sidebar.collapsible}
              style={processStyle({
                background: config.sidebar.background,
                boxShadow: config.sidebar.boxShadow,
                position: 'fixed',
                right: 0,
                top: config.header?.height || 64,
                bottom: 0
              })}
            >
              {config.sidebar?.components?.map(getLayoutComponent)}
            </Sider>
          )}
        </Layout>
      </Layout>
    );
  };

  return buildLayout();
};

export default LayoutBuilder;

// Example usage in App.jsx or PageBuilder:
/*
<LayoutBuilder type="default">
  <div>Page content</div>
</LayoutBuilder>
*/