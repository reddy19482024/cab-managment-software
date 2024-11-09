
// frontend/src/layouts/DefaultLayout.jsx
import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';

const { Header, Sider, Content } = Layout;

function DefaultLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { config } = useConfig();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const layoutConfig = config?.layouts?.types?.default?.config;

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
    },
  ];

  const handleMenuClick = (item) => {
    switch (item.key) {
      case 'logout':
        logout();
        navigate('/auth/login');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        navigate(item.key);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={layoutConfig?.sidebar?.width || 280}
        theme="light"
        className="border-r border-gray-200"
      >
        <div className="p-4 h-16 flex items-center justify-center border-b border-gray-200">
          <img 
            src="/logo.svg" 
            alt="Logo" 
            className={`transition-all ${collapsed ? 'w-8' : 'w-32'}`}
          />
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={[window.location.pathname]}
          items={config?.navigation?.main?.map(item => ({
            key: item.path,
            icon: React.createElement(Icons[item.icon]),
            label: item.title,
            children: item.children?.map(child => ({
              key: child.path,
              label: child.title,
            }))
          }))}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-4 flex justify-between items-center border-b border-gray-200" 
          style={{ height: layoutConfig?.header?.height || 64 }}
        >
          {React.createElement(
            collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, 
            { 
              className: 'text-lg cursor-pointer',
              onClick: () => setCollapsed(!collapsed) 
            }
          )}
          <Dropdown 
            menu={{ items: userMenuItems, onClick: handleMenuClick }} 
            placement="bottomRight"
          >
            <div className="flex items-center cursor-pointer">
              <span className="mr-3">{user?.name}</span>
              <Avatar icon={<UserOutlined />} />
            </div>
          </Dropdown>
        </Header>
        <Content className="p-6 overflow-auto" style={{ background: '#f5f5f5' }}>
          <div className="bg-white rounded-lg p-6 min-h-full">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default DefaultLayout;