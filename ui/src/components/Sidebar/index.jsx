import React, { useState } from 'react';
import { Layout, Menu, Dropdown, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import * as AntdIcons from '@ant-design/icons';

const { Sider } = Layout;

const SidebarComponent = ({ config, collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const getIcon = (iconName) => {
    if (!iconName) return null;
    const Icon = AntdIcons[iconName];
    return Icon ? <Icon /> : null;
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Show success message
      message.success('Logged out successfully');
      
      // Navigate to login page
      navigate('/', { replace: true });
    } catch (error) {
      message.error('Failed to logout');
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = ({ key, path, type }) => {
    if (type === 'button' && key === 'logout') {
      handleLogout();
    } else if (path) {
      navigate(path);
    }
  };

  const renderMenuItems = (items) => {
    return items.map(item => {
      if (item.type === 'group') {
        return (
          <Menu.ItemGroup 
            key={item.label} 
            title={!collapsed ? item.label : null}
          >
            {renderMenuItems(item.children)}
          </Menu.ItemGroup>
        );
      }
      return (
        <Menu.Item 
          key={item.key} 
          icon={getIcon(item.icon)}
          onClick={() => handleMenuClick(item)}
        >
          <span className={collapsed ? 'collapsed-item-label' : ''}>
            {item.label}
          </span>
        </Menu.Item>
      );
    });
  };

  const sidebarConfig = config.layout.sidebar;
  if (!sidebarConfig?.enabled) return null;

  // User profile dropdown menu
  const userMenu = (
    <Menu onClick={({ key }) => {
      const menuItem = sidebarConfig.footer.content.menu.items.find(item => item.key === key);
      handleMenuClick(menuItem);
    }}>
      {sidebarConfig.footer.content.menu.items.map(item => (
        <Menu.Item key={item.key} icon={getIcon(item.icon)}>
          {item.label}
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <Sider 
      trigger={null}
      collapsible 
      collapsed={collapsed}
      width={sidebarConfig.width}
      collapsedWidth={sidebarConfig.collapsedWidth}
      theme={sidebarConfig.theme}
      style={{
        ...sidebarConfig.style,
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        bottom: 0,
        paddingTop: 64
      }}
    >
      <Menu
        theme={sidebarConfig.theme}
        mode="inline"
        defaultSelectedKeys={['dashboard']}
        style={{
          borderRight: 0,
          height: sidebarConfig.footer?.enabled ? 'calc(100vh - 144px)' : 'calc(100vh - 64px)',
          overflowY: 'auto'
        }}
      >
        {renderMenuItems(sidebarConfig.menu.items)}
      </Menu>

      {sidebarConfig.footer?.enabled && (
        <Dropdown 
          overlay={userMenu} 
          trigger={['click']}
          placement="topRight"
          disabled={loading}
        >
          <div style={{
            ...sidebarConfig.footer.style,
            position: 'fixed',
            bottom: 0,
            width: collapsed ? sidebarConfig.collapsedWidth : sidebarConfig.width,
            transition: 'all 0.2s'
          }}>
            {collapsed ? (
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={sidebarConfig.footer.content.collapsed.avatar}
                  alt="User"
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img 
                  src={sidebarConfig.footer.content.expanded.avatar}
                  alt="User"
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff' }}>{sidebarConfig.footer.content.expanded.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px' }}>
                    {sidebarConfig.footer.content.expanded.role}
                  </div>
                </div>
                {!collapsed && <AntdIcons.CaretUpOutlined style={{ color: '#fff' }} />}
              </div>
            )}
          </div>
        </Dropdown>
      )}
    </Sider>
  );
};

export default SidebarComponent;