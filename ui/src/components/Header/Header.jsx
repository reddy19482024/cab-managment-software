// HeaderComponent.jsx
import React from 'react';
import { Layout, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

const HeaderComponent = ({ config, collapsed, onCollapse }) => {
  const headerConfig = config.layout?.header;

  if (!headerConfig?.enabled) return null;

  return (
    <Layout.Header 
      style={{
        ...(headerConfig.style || {}),
        position: 'fixed',
        width: '100%',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {headerConfig.logo && (
          <img 
            src={headerConfig.logo} 
            alt="Logo" 
            style={{ height: '32px', marginRight: '24px' }}
          />
        )}
        {config.layout?.sidebar?.enabled && (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => onCollapse(!collapsed)}
            style={{ fontSize: '16px' }}
          />
        )}
      </div>
    </Layout.Header>
  );
};

HeaderComponent.propTypes = {
  config: PropTypes.shape({
    layout: PropTypes.shape({
      header: PropTypes.shape({
        enabled: PropTypes.bool,
        style: PropTypes.object,
        logo: PropTypes.string
      }),
      sidebar: PropTypes.shape({
        enabled: PropTypes.bool
      })
    })
  }).isRequired,
  collapsed: PropTypes.bool.isRequired,
  onCollapse: PropTypes.func.isRequired
};

export default HeaderComponent;