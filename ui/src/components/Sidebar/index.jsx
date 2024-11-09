// components/Sidebar/index.js
import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined,
  UserOutlined,
  CarOutlined,
  CompassOutlined,
  SafetyOutlined,
  SettingOutlined,
  BarChartOutlined,
  DollarOutlined,
  ToolOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const SidebarComponent = ({ config, collapsed, onCollapse }) => {
  const getIcon = (iconName) => {
    const icons = {
      DashboardOutlined: <DashboardOutlined />,
      UserOutlined: <UserOutlined />,
      CarOutlined: <CarOutlined />,
      CompassOutlined: <CompassOutlined />,
      SafetyOutlined: <SafetyOutlined />,
      SettingOutlined: <SettingOutlined />,
      BarChartOutlined: <BarChartOutlined />,
      DollarOutlined: <DollarOutlined />,
      ToolOutlined: <ToolOutlined />
    };
    return icons[iconName];
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
          {item.label}
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
      style={sidebarConfig.style}
    >
      <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src={config.layout.header.logo} 
          alt="Logo" 
          style={{ height: '32px', margin: '16px' }}
        />
      </div>
      
      <Menu
        theme={sidebarConfig.theme}
        mode="inline"
        defaultSelectedKeys={['dashboard']}
      >
        {renderMenuItems(sidebarConfig.menu.items)}
      </Menu>

      {sidebarConfig.footer?.enabled && (
        <div style={sidebarConfig.footer.style}>
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