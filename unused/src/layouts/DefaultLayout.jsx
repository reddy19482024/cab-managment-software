// src/layouts/DefaultLayout.jsx
import React from 'react';
import { Layout, Menu } from 'antd';
import { useConfig } from '../contexts/ConfigContext';

const { Header, Sider, Content } = Layout;

const DefaultLayout = ({ children }) => {
  const { config } = useConfig();
  const layoutConfig = config.layouts?.default;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: 0, background: layoutConfig?.header?.background }}>
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
          {layoutConfig?.header?.menu?.map(item => (
            <Menu.Item key={item.key}>{item.label}</Menu.Item>
          ))}
        </Menu>
      </Header>
      <Layout>
        {layoutConfig?.sider && (
          <Sider 
            width={layoutConfig.sider.width} 
            collapsible={layoutConfig.sider.collapsible}
          >
            <Menu
              theme="dark"
              mode="inline"
              defaultSelectedKeys={['1']}
            >
              {layoutConfig.sider.menu?.map(item => (
                <Menu.Item key={item.key}>{item.label}</Menu.Item>
              ))}
            </Menu>
          </Sider>
        )}
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DefaultLayout;