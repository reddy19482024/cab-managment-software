import React, { useEffect, useState } from 'react';
import { Layout, Form, Spin, Button, message } from 'antd';
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
import useApi from '../../hooks/useApi';

const { Content } = Layout;

const DynamicPage = ({ configName }) => {
  const [config, setConfig] = useState(null);
  const [form] = Form.useForm();
  const [pageLoading, setPageLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentModal, setCurrentModal] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [collapsed, setCollapsed] = useState(true);
  
  const { apiRequest, loading } = useApi();
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

  const loadPageConfig = async () => {
    try {
      setPageLoading(true);
      const loadedConfig = await configLoader(configName);
      setConfig(loadedConfig || null);
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const loadTableData = async (apiConfig) => {
    if (!apiConfig) return;
  
    const data = await apiRequest(apiConfig.endpoint, apiConfig.method || 'GET');
    if (data) {
      // Get table columns from config
      const formSection = config.sections?.find(section => section.type === 'form');
      const columns = formSection?.table?.columns || [];
      
      // Extract column dataIndex values, excluding 'actions'
      const columnFields = columns
        .filter(col => col.dataIndex && col.dataIndex !== 'actions')
        .map(col => col.dataIndex);
  
      setTableData(
        data.data.map(item => {
          const mappedItem = {
            id: item._id,  // Always include id for internal operations
            _id: item._id  // Always include _id for internal operations
          };
  
          // Map only the fields defined in table columns
          columnFields.forEach(field => {
            if (item[field] !== undefined) {
              mappedItem[field] = item[field];
            }
          });
  
          return mappedItem;
        })
      );
    }
  };

  const handleApiAction = async (action, values, record = null) => {
    if (!action?.api) {
      message.error('API configuration is missing');
      return;
    }

    let endpoint = action.api.endpoint;
    if (record?._id) {
      endpoint = endpoint.replace('{id}', record._id);
    }

    const requestBody = action.api.method !== 'GET'
      ? { ...values, role: values.role?.toLowerCase() }
      : null;

    const response = await apiRequest(endpoint, action.api.method, requestBody);

    if (response) {
      message.success(action.messages?.success || 'Operation successful');
      if (currentModal) handleModalClose();
      const formSection = config.sections?.find(section => section.type === 'form');
      if (formSection?.table?.enabled && formSection?.table?.api) {
        loadTableData(formSection.table.api);
      }
      form.resetFields();
    }
  };

  // Added handleFormSubmit function
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
    form.setFieldsValue(record || {});
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

    if (!action?.api || !selectedRecord?._id) {
      message.error('Delete configuration or record is missing');
      return;
    }

    const endpoint = action.api.endpoint.replace('{id}', selectedRecord._id);
    const response = await apiRequest(endpoint, action.api.method);

    if (response) {
      message.success('Employee deleted successfully');
      handleModalClose();
      loadTableData(config.sections?.find(section => section.type === 'form')?.table?.api);
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
      {config?.layout?.header?.enabled && (
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
      
      <Layout style={{ marginTop: config?.layout?.header?.enabled ? 64 : 0 }}>
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
                    handleModalOpen(modalId, record ? { ...record, id: record.id || record._id, _id: record._id || record.id } : null);
                  }}
                />
              ) : (
                <FormComponent
                  config={config}
                  form={form}
                  loading={loading}
                  onModalOpen={handleModalOpen}
                  onFormSubmit={handleFormSubmit} // Added handleFormSubmit here
                />
              )}
            </div>
          </Content>

          {config?.layout?.footer?.enabled && (
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
        onSubmit={handleFormSubmit} // Added handleFormSubmit here
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
