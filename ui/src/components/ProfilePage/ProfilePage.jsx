import React, { useEffect, useState } from 'react';
import { Layout, Form, message, Spin, Button, Menu, Avatar, Upload, Input, Select, Switch } from 'antd';
import { 
  SaveOutlined, 
  UserOutlined, 
  SettingOutlined, 
  LockOutlined,
  UploadOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import PropTypes from 'prop-types';
import Header from '../Layout/Header';
import Footer from '../Layout/Footer';
import SidebarComponent from '../Sidebar';
import configLoader from '../../utils/configLoader';

const { Content, Sider } = Layout;

const ProfilePage = ({ configName }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('basic');
  const [collapsed, setCollapsed] = useState(false);
  const [form] = Form.useForm();
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    loadProfileConfig();
  }, [configName]);

  const loadProfileConfig = async () => {
    try {
      setPageLoading(true);
      const loadedConfig = await configLoader(configName);
      setConfig(loadedConfig || null);
      await loadProfileData();
    } catch (error) {
      message.error('Failed to load profile configuration');
      console.error("Error loading config:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const loadProfileData = async () => {
    if (!config?.api?.getProfile) return;

    try {
      setLoading(true);
      const response = await fetch(config.api.getProfile.endpoint, {
        method: config.api.getProfile.method || 'GET',
        headers: config.api.getProfile.headers || {},
      });

      if (response.ok) {
        const data = await response.json();
        form.setFieldsValue(data);
        setAvatar(data.avatar);
      } else {
        throw new Error('Failed to load profile data');
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      if (config.sections) {
        const defaultValues = {};
        config.sections.forEach(section => {
          section.fields?.forEach(field => {
            if (field.defaultValue !== undefined) {
              defaultValues[field.name] = field.defaultValue;
            }
          });
        });
        form.setFieldsValue(defaultValues);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    if (!config?.api?.updateProfile) {
      message.error('API configuration is missing');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      
      Object.keys(values).forEach(key => {
        if (key === 'avatar' && values[key]?.file) {
          formData.append('avatar', values[key].file);
        } else {
          formData.append(key, values[key]);
        }
      });

      const response = await fetch(config.api.updateProfile.endpoint, {
        method: config.api.updateProfile.method || 'PUT',
        headers: {
          ...config.api.updateProfile.headers
        },
        body: formData
      });

      if (response.ok) {
        message.success('Profile updated successfully');
        loadProfileData();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      message.error(error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const formItemProps = {
      label: field.label,
      name: field.name,
      rules: field.rules || [],
      tooltip: field.tooltip,
      ...(field.formItemProps || {})
    };

    if (field.type === 'upload') {
      return (
        <Form.Item {...formItemProps}>
          <Upload
            listType="picture-circle"
            showUploadList={false}
            beforeUpload={(file) => {
              const isImage = file.type.startsWith('image/');
              if (!isImage) {
                message.error('You can only upload image files!');
              }
              return false;
            }}
            onChange={({ file }) => {
              if (file.status !== 'removed') {
                const reader = new FileReader();
                reader.onload = (e) => {
                  setAvatar(e.target.result);
                };
                reader.readAsDataURL(file);
                form.setFieldsValue({ avatar: { file } });
              }
            }}
          >
            {avatar ? (
              <Avatar 
                src={avatar} 
                size={100}
                style={{ cursor: 'pointer' }}
              />
            ) : (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      );
    }

    switch (field.type) {
      case 'password':
        return (
          <Form.Item {...formItemProps}>
            <Input.Password
              disabled={field.disabled}
              placeholder={field.placeholder}
              {...field.componentProps}
            />
          </Form.Item>
        );
      case 'select':
        return (
          <Form.Item {...formItemProps}>
            <Select
              options={field.options}
              disabled={field.disabled}
              placeholder={field.placeholder}
              {...field.componentProps}
            />
          </Form.Item>
        );
      case 'switch':
        return (
          <Form.Item {...formItemProps} valuePropName="checked">
            <Switch disabled={field.disabled} />
          </Form.Item>
        );
      default:
        return (
          <Form.Item {...formItemProps}>
            <Input
              disabled={field.disabled}
              placeholder={field.placeholder}
              {...field.componentProps}
            />
          </Form.Item>
        );
    }
  };

  const getMenuItems = () => {
    return config.sections.map(section => ({
      key: section.key,
      icon: section.icon === 'UserOutlined' ? <UserOutlined /> :
            section.icon === 'SettingOutlined' ? <SettingOutlined /> :
            section.icon === 'LockOutlined' ? <LockOutlined /> : null,
      label: section.title
    }));
  };

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!config) return null;

  const selectedSection = config.sections.find(section => section.key === currentSection);

  return (
    <Layout>
      {config.layout.header.enabled && (
        <Layout.Header 
          style={{
            ...config.layout.header.style,
            position: 'fixed',
            width: '100%',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {config.layout.header.logo && (
              <img 
                src={config.layout.header.logo} 
                alt="Logo" 
                style={{ height: '32px', marginRight: '24px' }}
              />
            )}
            {config.layout.sidebar?.enabled && (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px' }}
              />
            )}
          </div>
        </Layout.Header>
      )}
      
      <Layout style={{ marginTop: config.layout.header.enabled ? 64 : 0 }}>
        {config.layout.sidebar?.enabled && (
          <SidebarComponent 
            config={config}
            collapsed={collapsed}
            onCollapse={setCollapsed}
          />
        )}
        
        <Layout style={{ 
          transition: 'all 0.2s',
          marginLeft: config.layout.sidebar?.enabled 
            ? (collapsed ? `${config.layout.sidebar.collapsedWidth}px` : `${config.layout.sidebar.width}px`)
            : 0
        }}>
          <Content style={{
            ...config.layout.content.style,
            minHeight: config.layout.header.enabled ? 'calc(100vh - 64px)' : '100vh',
            padding: '24px'
          }}>
            <Layout style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
              <Sider
                width={250}
                style={{
                  background: '#fff',
                  borderRight: '1px solid #f0f0f0'
                }}
              >
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <Avatar 
                    size={80} 
                    src={avatar}
                    icon={!avatar && <UserOutlined />}
                  />
                  <h3 style={{ marginTop: '16px', marginBottom: '4px' }}>
                    {form.getFieldValue('name') || 'User Name'}
                  </h3>
                  <p style={{ color: '#666', margin: 0 }}>
                    {form.getFieldValue('email') || 'user@example.com'}
                  </p>
                </div>
                <Menu
                  mode="inline"
                  selectedKeys={[currentSection]}
                  items={getMenuItems()}
                  onClick={({ key }) => setCurrentSection(key)}
                />
              </Sider>
              
              <Content style={{ padding: '24px', minHeight: '100%' }}>
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>{selectedSection?.title}</h2>
                    {selectedSection?.description && (
                      <p style={{ margin: '4px 0 0 0', color: '#666' }}>{selectedSection.description}</p>
                    )}
                  </div>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={loading}
                    onClick={() => form.submit()}
                  >
                    Save Changes
                  </Button>
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSave}
                  scrollToFirstError
                >
                  {selectedSection?.fields?.map(field => renderField(field))}
                </Form>
              </Content>
            </Layout>
          </Content>

          {config.layout.footer.enabled && (
            <Layout.Footer style={{ ...config.layout.footer.style, width: '100%' }}>
              {config.layout.footer.text}
              <div style={{ marginTop: 8 }}>
                {config.layout.footer.links?.map((link, index) => (
                  <a 
                    key={index} 
                    href={link.url}
                    style={{ marginLeft: index > 0 ? 16 : 0 }}
                  >
                    {link.text}
                  </a>
                ))}
              </div>
            </Layout.Footer>
          )}
        </Layout>
      </Layout>
    </Layout>
  );
};

ProfilePage.propTypes = {
  configName: PropTypes.string.isRequired
};

export default ProfilePage;