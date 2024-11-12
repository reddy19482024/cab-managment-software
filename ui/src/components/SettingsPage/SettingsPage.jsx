import React, { useEffect, useState } from 'react';
import { Layout, Form, message, Spin, Button, Tabs, Switch, Select, Input, InputNumber } from 'antd';
import { SaveOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import * as AntdIcons from '@ant-design/icons';
import PropTypes from 'prop-types';
import Header from '../Layout/Header';
import Footer from '../Layout/Footer';
import SidebarComponent from '../Sidebar';
import configLoader from '../../utils/configLoader';

const { Content } = Layout;

const SettingsPage = ({ configName }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [form] = Form.useForm();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    loadSettingsConfig();
  }, [configName]);

  const loadSettingsConfig = async () => {
    try {
      setPageLoading(true);
      const loadedConfig = await configLoader(configName);
      setConfig(loadedConfig || null);
      if (loadedConfig?.layout?.defaultActiveTab) {
        setActiveTab(loadedConfig.layout.defaultActiveTab);
      }
      await loadSettingsData();
    } catch (error) {
      message.error('Failed to load settings configuration');
      console.error("Error loading config:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const loadSettingsData = async () => {
    if (!config?.api?.getSettings) return;

    try {
      setLoading(true);
      const response = await fetch(config.api.getSettings.endpoint, {
        method: config.api.getSettings.method || 'GET',
        headers: config.api.getSettings.headers || {},
      });

      if (response.ok) {
        const data = await response.json();
        form.setFieldsValue(data);
      } else {
        throw new Error('Failed to load settings');
      }
    } catch (error) {
      console.error("Error loading settings:", error);
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
    if (!config?.api?.updateSettings) {
      message.error('API configuration is missing');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(config.api.updateSettings.endpoint, {
        method: config.api.updateSettings.method || 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...config.api.updateSettings.headers
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success('Settings updated successfully');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      message.error(error.message || 'Failed to save settings');
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

    switch (field.type) {
      case 'switch':
        return (
          <Form.Item {...formItemProps} valuePropName="checked">
            <Switch disabled={field.disabled} />
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
      case 'textarea':
        return (
          <Form.Item {...formItemProps}>
            <Input.TextArea
              disabled={field.disabled}
              placeholder={field.placeholder}
              {...field.componentProps}
            />
          </Form.Item>
        );
      case 'number':
        return (
          <Form.Item {...formItemProps}>
            <InputNumber
              disabled={field.disabled}
              placeholder={field.placeholder}
              {...field.componentProps}
            />
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

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!config) return null;

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
            padding: '24px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ background: '#fff', padding: '24px', minHeight: '100%' }}>
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0 }}>{config.title}</h2>
                  {config.description && (
                    <p style={{ margin: '4px 0 0 0', color: '#666' }}>{config.description}</p>
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
                layout={config.layout?.formLayout || 'vertical'}
                onFinish={handleSave}
                scrollToFirstError
              >
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={config.sections.map(section => ({
                    key: section.key,
                    label: (
                      <span>
                        {section.icon && React.createElement(AntdIcons[section.icon])}
                        <span style={{ marginLeft: section.icon ? '8px' : 0 }}>{section.title}</span>
                      </span>
                    ),
                    children: (
                      <div style={{ padding: '24px 0' }}>
                        {section.description && (
                          <p style={{ marginBottom: '24px', color: '#666' }}>{section.description}</p>
                        )}
                        {section.fields?.map(field => renderField(field))}
                      </div>
                    )
                  }))}
                />
              </Form>
            </div>
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

SettingsPage.propTypes = {
  configName: PropTypes.string.isRequired
};

export default SettingsPage;
