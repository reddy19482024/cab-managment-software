import React, { useEffect, useState } from 'react';
import { Layout, Form, message, Spin, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Header from '../Layout/Header';
import Footer from '../Layout/Footer';
import SidebarComponent from '../Sidebar';
import ModalComponent from '../Modal';
import FormComponent from '../Form';
import TableComponent from '../Table';
import configLoader from '../../utils/configLoader';

const { Content } = Layout;

const DynamicPage = ({ configName }) => {
  const [config, setConfig] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentModal, setCurrentModal] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [collapsed, setCollapsed] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPageConfig();
  }, [configName]);

  useEffect(() => {
    if (config) {
      const formSection = config.sections?.find(section => section.type === 'form');
      if (formSection?.table?.enabled && formSection?.table?.api) {
        loadTableData(formSection.table.api);
      }
    }
  }, [config]);

  const constructApiUrl = (endpoint) => {
    const baseUrl = import.meta.env.VITE_API_URL;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/', { replace: true });
      return null;
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleAuthError = (error) => {
    if (error.message.toLowerCase().includes('unauthorized') || 
        error.message.toLowerCase().includes('expire')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      navigate('/', { replace: true });
      message.error('Session expired. Please login again.');
    }
  };

  const loadPageConfig = async () => {
    try {
      setPageLoading(true);
      const loadedConfig = await configLoader(configName);
      setConfig(loadedConfig || null);
    } catch (error) {
      message.error('Failed to load page configuration');
      console.error("Error loading config:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const loadTableData = async (apiConfig) => {
    if (!apiConfig) return;
  
    try {
      setLoading(true);
      const apiUrl = constructApiUrl(apiConfig.endpoint);
      const headers = getAuthHeaders();
  
      if (!headers) return;
  
      const response = await fetch(apiUrl, {
        method: apiConfig.method || 'GET',
        headers: headers
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to load data');
      }
  
      const responseData = await response.json();
      // Check if response has data property and it's an array
      const dataArray = responseData.data && Array.isArray(responseData.data) 
        ? responseData.data 
        : Array.isArray(responseData) 
          ? responseData 
          : [];
  
      // Map the data to match the expected format
      const formattedData = dataArray.map(item => ({
        id: item._id, // Map _id to id for consistent usage
        name: item.name,
        email: item.email,
        role: item.role,
        phone: item.phone
      }));
  
      setTableData(formattedData);
    } catch (error) {
      console.error("Error loading table data:", error);
      handleAuthError(error);
      const formSection = config.sections?.find(section => section.type === 'form');
      setTableData(formSection?.table?.fallbackData || []);
    } finally {
      setLoading(false);
    }
  };

  const handleApiAction = async (action, values, record = null) => {
    if (!action?.api) {
      message.error('API configuration is missing');
      return;
    }
  
    try {
      setLoading(true);
      
      let endpoint = action.api.endpoint;
      if (record?.id) {
        // Update endpoint to use _id instead of id
        endpoint = endpoint.replace(/{(\w+)}/g, (_, param) => {
          if (param === 'id') {
            return record._id || record.id; // Support both _id and id
          }
          return record[param] || '';
        });
      }
  
      const apiUrl = constructApiUrl(endpoint);
      const headers = getAuthHeaders();
  
      if (!headers) return;
  
      const response = await fetch(apiUrl, {
        method: action.api.method,
        headers: headers,
        body: action.api.method !== 'GET' ? JSON.stringify(values) : undefined,
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        throw new Error(responseData.message || action.messages?.failure || 'Operation failed');
      }
  
      message.success(responseData.message || action.messages?.success || 'Operation successful');
      
      if (currentModal) {
        handleModalClose();
      }
  
      const formSection = config.sections?.find(section => section.type === 'form');
      if (formSection?.table?.enabled && formSection?.table?.api) {
        loadTableData(formSection.table.api);
      }
  
      form.resetFields();
    } catch (error) {
      console.error("API action error:", error);
      handleAuthError(error);
      message.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };
  const handleFormSubmit = async (values) => {
    const formSection = config.sections?.find(section => section.type === 'form');
    const modalConfig = currentModal ? config.modals[currentModal] : null;
    const action = modalConfig?.actions?.[0] || formSection?.actions?.[0];

    await handleApiAction(action, values, selectedRecord);
  };

  const handleModalOpen = (modalId, record = null) => {
    setCurrentModal(modalId);
    setSelectedRecord(record);
    setModalVisible(true);
    if (record) {
      form.setFieldsValue(record);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setCurrentModal(null);
    setSelectedRecord(null);
    form.resetFields();
  };

  const handleDelete = async () => {
    const modalConfig = config?.modals?.[currentModal];
    const action = modalConfig?.actions?.[0];

    if (!action?.api || !selectedRecord?.id) {
      message.error('Delete configuration or record is missing');
      return;
    }

    // Add confirmation dialog for delete
    if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      await handleApiAction(action, null, selectedRecord);
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

  const formSection = config.sections?.find(section => section.type === 'form');
  const bannerSection = config.sections?.find(section => section.type === 'banner');

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
            padding: 0,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {bannerSection && (
                <div style={{ ...bannerSection.style }}>
                  <div style={{ ...bannerSection.content.style }}>
                    {bannerSection.content.image && (
                      <img 
                        src={bannerSection.content.image} 
                        alt="Banner" 
                        style={{ height: '32px', marginBottom: '12px' }}
                      />
                    )}
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                      {bannerSection.content.title}
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '4px 0 0 0' }}>
                      {bannerSection.content.description}
                    </p>
                  </div>
                </div>
              )}

              {formSection?.table?.enabled ? (
                <TableComponent
                    config={config}
                    loading={loading}
                    tableData={tableData}
                    onModalOpen={(modalId, record) => {
                      // Ensure record has both id and _id for compatibility
                      const enhancedRecord = {
                        ...record,
                        id: record.id || record._id,
                        _id: record._id || record.id
                      };
                      handleModalOpen(modalId, enhancedRecord);
                    }}
                  />
              ) : (
                <FormComponent
                  config={config}
                  form={form}
                  loading={loading}
                  onModalOpen={handleModalOpen}
                  onFormSubmit={handleFormSubmit}
                />
              )}
            </div>
          </Content>

          {config.layout.footer?.enabled && (
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

      <ModalComponent
        modalConfig={currentModal ? config.modals[currentModal] : null}
        visible={modalVisible}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        onDelete={handleDelete}
        loading={loading}
        form={form}
        record={selectedRecord}
      />
    </Layout>
  );
};

DynamicPage.propTypes = {
  configName: PropTypes.string.isRequired
};

export default DynamicPage;