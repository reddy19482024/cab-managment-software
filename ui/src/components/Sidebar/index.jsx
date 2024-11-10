import React from 'react';
import { Layout, Menu } from 'antd';
import * as AntdIcons from '@ant-design/icons';

const { Sider } = Layout;

const SidebarComponent = ({ config, collapsed, onCollapse }) => {
  const getIcon = (iconName) => {
    if (!iconName) return null;
    const Icon = AntdIcons[iconName];
    return Icon ? <Icon /> : null;
  };

  const renderMenuItems = (items) => {
    return items.map(item => {
      if (item.type === 'group') {
        return (
          <Menu.ItemGroup key={item.label} title={item.label}>
            {renderMenuItems(item.children)}
          </Menu.ItemGroup>
        );
      }
      return (
        <Menu.Item key={item.key} icon={getIcon(item.icon)}>
          <a href={item.path}>{item.label}</a>
        </Menu.Item>
      );
    });
  };

  const sidebarConfig = config.layout.sidebar;
  if (!sidebarConfig?.enabled) return null;

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
        paddingTop: 64 // Header height
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
              <div>
                <div style={{ color: '#fff' }}>{sidebarConfig.footer.content.expanded.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px' }}>
                  {sidebarConfig.footer.content.expanded.role}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Sider>
  );
};

export default SidebarComponent;