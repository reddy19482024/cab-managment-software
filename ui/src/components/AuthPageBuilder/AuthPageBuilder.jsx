import React, { useEffect, useState } from 'react';
import { Layout, Form, message, Spin } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import FormComponent from '../Form';
import configLoader from '../../utils/configLoader';

const { Content } = Layout;

const AuthPageBuilder = ({ configName, onAuthStateChange }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadAuthConfig();
  }, [configName]);

  const loadAuthConfig = async () => {
    try {
      setPageLoading(true);
      const loadedConfig = await configLoader(configName);
      setConfig(loadedConfig || null);
    } catch (error) {
      message.error('Failed to load authentication configuration');
      console.error("Error loading config:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      setLoading(true);
      console.log(`Initiating ${provider} login flow`);
      message.info(`${provider} login integration required`);
    } catch (error) {
      message.error(`Failed to login with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (values) => {
    const formSection = config.sections?.find(section => section.type === 'form');
    const action = formSection?.actions?.find(action => action.type === 'submit');

    if (!action?.api) {
      message.error('API configuration is missing');
      return;
    }

    try {
      setLoading(true);

      // Use import.meta.env instead of process.env for Vite
      const apiUrl = `${import.meta.env.VITE_API_URL}${action.api.endpoint}`;
      console.log('API URL:', apiUrl); // For debugging

      const response = await fetch(apiUrl, {
        method: action.api.method,
        headers: {
          ...action.api.headers,
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        // Store auth token and user data
        localStorage.setItem('authToken', data.token);
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify(data.user));
        }

        message.success(action.messages?.success || 'Authentication successful');
        
        // Update auth state
        if (onAuthStateChange) {
          onAuthStateChange(true);
        }

        // Navigate to intended page or dashboard
        const intendedPath = location.state?.from?.pathname || '/dashboard';
        navigate(intendedPath, { replace: true });
      } else {
        throw new Error(data.message || action.messages?.failure || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      message.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Rest of the component remains the same...
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
      <Content style={{
        ...config.layout.content.style,
        background: config.layout.content.style.background || '#f0f2f5'
      }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {config.layout.header?.enabled && (
            <div style={{ marginBottom: '48px', textAlign: 'center' }}>
              {config.layout.header.logo && (
                <img 
                  src={config.layout.header.logo} 
                  alt="Logo" 
                  style={{ 
                    height: config.layout.header.logoHeight || '48px',
                    marginBottom: '24px'
                  }} 
                />
              )}
              {config.layout.header.title && (
                <h1 style={{ 
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: 0,
                  color: config.layout.header.titleColor || '#000000'
                }}>
                  {config.layout.header.title}
                </h1>
              )}
            </div>
          )}

          <FormComponent
            config={config}
            form={form}
            loading={loading}
            onFormSubmit={handleFormSubmit}
            onSocialLogin={handleSocialLogin}
          />

          {config.layout.footer?.enabled && (
            <div style={{
              marginTop: '48px',
              textAlign: 'center',
              ...config.layout.footer.style
            }}>
              {config.layout.footer.text && (
                <p style={{ 
                  color: config.layout.footer.textColor || '#666666',
                  margin: 0 
                }}>
                  {config.layout.footer.text}
                </p>
              )}
              {config.layout.footer.links && (
                <div style={{ marginTop: '16px' }}>
                  {config.layout.footer.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      style={{
                        color: link.color || '#1890ff',
                        marginLeft: index > 0 ? '16px' : 0,
                        ...link.style
                      }}
                    >
                      {link.text}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
};

AuthPageBuilder.propTypes = {
  configName: PropTypes.string.isRequired,
  onAuthStateChange: PropTypes.func.isRequired
};

export default AuthPageBuilder;