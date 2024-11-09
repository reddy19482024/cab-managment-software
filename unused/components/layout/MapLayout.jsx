// frontend/src/layouts/MapLayout.jsx
import React, { useState } from 'react';
import { Layout, Button } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined 
} from '@ant-design/icons';
import { useConfig } from '@/contexts/ConfigContext';

const { Header, Sider, Content } = Layout;

function MapLayout({ children, sidebarContent }) {
  const [collapsed, setCollapsed] = useState(false);
  const { config } = useConfig();
  const layoutConfig = config?.layouts?.types?.map?.config;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout>
        <Header className="bg-white px-4 flex items-center border-b border-gray-200"
          style={{ height: layoutConfig?.header?.height || 64 }}
        >
          <div className="flex-1">
            <Button
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          </div>
        </Header>
        <Content className="relative">
          {children}
        </Content>
      </Layout>
      <Sider
        theme="light"
        trigger={null}
        collapsible
        collapsed={collapsed}
        collapsedWidth={0}
        width={layoutConfig?.sidebar?.width || 320}
        reverseArrow
        style={{
          background: '#fff',
          position: 'fixed',
          right: 0,
          top: layoutConfig?.header?.height || 64,
          bottom: 0,
          zIndex: 1000,
          boxShadow: '-4px 0 6px rgba(0, 0, 0, 0.05)'
        }}
      >
        {sidebarContent}
      </Sider>
    </Layout>
  );
}

export default MapLayout;
