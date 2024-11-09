// components/DynamicPage/index.js
import React, { useEffect, useState } from 'react';
import { Layout, Form, message, Spin, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import Header from '../Layout/Header';
import Footer from '../Layout/Footer';
import SidebarComponent from '../Sidebar';
import ModalComponent from '../Modal';
import FormPageComponent from '../FormPage';
import configLoader from '../../utils/configLoader';

const { Content } = Layout;

const DynamicPage = ({ configName }) => {
  // State Management
  const [config, setConfig] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentModal, setCurrentModal] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  // Initial Load
  useEffect(() => {
    loadPageConfig();
  }, [configName]);

  // Load Table Data when config changes
  useEffect(() => {
    if (config) {
      const formSection = config.sections?.find(section => section.type === 'form');
      if (formSection?.table?.enabled) {
        loadTableData();
      }
    }
  }, [config]);

  // Configuration Loading
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

  // Table Data Loading
  const loadTableData = async () => {
    const formSection = config?.sections?.find(section => section.type === 'form');
    const tableConfig = formSection?.table;
    if (!tableConfig?.api) return;

    try {
      setLoading(true);
      const response = await fetch(tableConfig.api.endpoint, {
        method: tableConfig.api.method,
        headers: tableConfig.api.headers || {},
      });

      if (response.ok) {
        const data = await response.json();
        setTableData(Array.isArray(data) ? data : tableConfig.fallbackData || []);
      } else {
        setTableData(tableConfig.fallbackData || []);
      }
    } catch (error) {
      console.error("Error loading table data:", error);
      setTableData(tableConfig.fallbackData || []);
    } finally {
      setLoading(false);
    }
  };

  // Form Submission Handler
  const handleFormSubmit = async (values) => {
    const formSection = config?.sections?.find(section => section.type === 'form');
    const action = currentModal ? config?.modals?.[currentModal]?.actions?.[0] : formSection?.actions?.[0];

    if (!action?.api) {
      message.error('Action configuration is missing');
      return;
    }

    try {
      setLoading(true);
      
      let endpoint = action.api.endpoint;
      if (selectedRecord?.id && currentModal === 'editEmployeeModal') {
        endpoint = endpoint.replace('{id}', selectedRecord.id);
      }

      const response = await fetch(endpoint, {
        method: action.api.method,
        headers: { ...action.api.headers },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(action.messages.success || 'Operation succeeded');
        if (currentModal) {
          handleModalClose();
          loadTableData();
        } else {
          form.resetFields();
        }
      } else {
        throw new Error(action.messages.failure || 'Operation failed');
      }
    } catch (error) {
      message.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Modal Handlers
  const handleModalOpen = (modalId, record = null) => {
    setCurrentModal(modalId);
    setSelectedRecord(record);
    setModalVisible(true);
    if (record && modalId === 'editEmployeeModal') {
      form.setFieldsValue(record);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setCurrentModal(null);
    setSelectedRecord(null);
    form.resetFields();
  };

  // Delete Handler
  const handleDelete = async () => {
    const modalConfig = config?.modals?.deleteEmployeeModal;
    const action = modalConfig?.actions?.[0];

    if (!action?.api || !selectedRecord?.id) {
      message.error('Delete configuration or record is missing');
      return;
    }

    try {
      setLoading(true);
      const endpoint = action.api.endpoint.replace('{id}', selectedRecord.id);

      const response = await fetch(endpoint, {
        method: action.api.method,
        headers: action.api.headers || {}
      });

      if (response.ok) {
        message.success(action.messages.success || 'Delete succeeded');
        handleModalClose();
        loadTableData();
      } else {
        throw new Error(action.messages.failure || 'Delete failed');
      }
    } catch (error) {
      message.error(error.message || 'Delete operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (pageLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
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
            <img 
              src={config.layout.header.logo} 
              alt="Logo" 
              style={{ height: '32px', marginRight: '24px' }}
            />
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px' }}
            />
          </div>
        </Layout.Header>
      )}
      
      <Layout style={{ marginTop: 64 }}>
        <SidebarComponent 
          config={config}
          collapsed={collapsed}
          onCollapse={setCollapsed}
        />
        
        <Layout style={{ 
          transition: 'all 0.2s',
          marginLeft: collapsed ? `${config.layout.sidebar.collapsedWidth}px` : `${config.layout.sidebar.width}px`
        }}>
          <Content style={{
            ...config.layout.content.style,
            minHeight: 'calc(100vh - 64px)',
            padding: 0,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <FormPageComponent
              config={config}
              form={form}
              loading={loading}
              tableData={tableData}
              onModalOpen={handleModalOpen}
              onFormSubmit={handleFormSubmit}
            />
          </Content>

          {config.layout.footer.enabled && (
            <Layout.Footer style={{
              ...config.layout.footer.style,
              width: '100%'
            }}>
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
        currentModal={currentModal}
      />
    </Layout>
  );
};

export default DynamicPage;