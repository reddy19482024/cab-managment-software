// src/components/Header/HeaderComponent.jsx
import React from 'react';
import { Layout, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

const HeaderComponent = ({ config, collapsed, onCollapse }) => {
  // Directly pass config instead of config.layout.header from DynamicPage
  if (!config?.enabled) return null;

  return (
    <Layout.Header 
      style={{
        ...(config.style || {}),
        position: 'fixed',
        width: '100%',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {config.logo && (
          <img 
            src={config.logo} 
            alt="Logo" 
            style={{ height: '32px', marginRight: '24px' }}
          />
        )}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => onCollapse(!collapsed)}
          style={{ fontSize: '16px', width: 64, height: 64 }}
        />
      </div>

      {/* Add title from config if available */}
      {config.title && (
        <div style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 500 }}>
          {config.title}
        </div>
      )}

      {/* Right side content placeholder */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {config.rightContent}
      </div>
    </Layout.Header>
  );
};

HeaderComponent.propTypes = {
  config: PropTypes.shape({
    enabled: PropTypes.bool,
    style: PropTypes.object,
    logo: PropTypes.string,
    title: PropTypes.string,
    rightContent: PropTypes.node
  }).isRequired,
  collapsed: PropTypes.bool.isRequired,
  onCollapse: PropTypes.func.isRequired
};

export default HeaderComponent;