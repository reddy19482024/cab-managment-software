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
  const [searchParams, setSearchParams] = useState({});
  const [filterParams, setFilterParams] = useState({});
  
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
  }, [config, searchParams, filterParams]);

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

  const transformDataForFields = (data, fields) => {
    const transformedData = { ...data };
    
    fields?.forEach(field => {
      // Handle fields with dependencies (usually relationship fields)
      if (field.dependencies && field.api?.transform) {
        const fieldValue = data[field.name];
        
        // If field has a value and it's an object
        if (fieldValue && typeof fieldValue === 'object') {
          const valueKey = field.api.transform.valueKey;
          transformedData[field.name] = valueKey ? fieldValue[valueKey] : fieldValue;
        }
      }
      
      // Handle nested fields
      if (field.dataIndex && Array.isArray(field.dataIndex)) {
        const value = field.dataIndex.reduce((obj, key) => obj?.[key], data);
        if (value !== undefined) {
          transformedData[field.name] = value;
        }
      }
    });

    return transformedData;
  };

  const loadTableData = async (apiConfig) => {
    if (!apiConfig) return;
  
    const queryParams = {
      ...(apiConfig.params || {}),
      ...searchParams,
      ...filterParams
    };

    const data = await apiRequest(
      apiConfig.endpoint, 
      apiConfig.method || 'GET',
      null,
      queryParams
    );

    if (data?.data) {
      const formSection = config.sections?.find(section => section.type === 'form');
      const columns = formSection?.table?.columns || [];
      
      const processedData = data.data.map(item => {
        const processedItem = { ...item };

        // Process any nested fields defined in columns
        columns.forEach(col => {
          if (Array.isArray(col.dataIndex)) {
            const value = col.dataIndex.reduce((obj, key) => obj?.[key], item);
            if (value !== undefined) {
              let current = processedItem;
              for (let i = 0; i < col.dataIndex.length - 1; i++) {
                const key = col.dataIndex[i];
                current[key] = current[key] || {};
                current = current[key];
              }
              current[col.dataIndex[col.dataIndex.length - 1]] = value;
            }
          }
        });

        return {
          id: item._id || item.id,
          _id: item._id || item.id,
          ...processedItem
        };
      });

      setTableData(processedData);
    }
  };

  const handleSearch = (value, fields) => {
    setSearchParams(value ? {
      search: value,
      searchFields: fields.join(',')
    } : {});
  };

  const handleFilter = (filters) => {
    setFilterParams(Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    ));
  };

  const prepareRequestBody = (values, modalConfig) => {
    const preparedData = { ...values };

    modalConfig?.fields?.forEach(field => {
      // Handle field-specific transformations based on field type
      if (field.type === 'select' && field.mode === 'multiple') {
        preparedData[field.name] = values[field.name] || [];
      }
      
      // Handle relationship fields
      if (field.dependencies) {
        const value = values[field.name];
        if (value === undefined || value === '') {
          preparedData[field.name] = null;
        }
      }
    });

    return preparedData;
  };

  const handleApiAction = async (action, values, record = null) => {
    if (!action?.api) return;

    let endpoint = action.api.endpoint;
    if (record?._id) {
      endpoint = endpoint.replace('{id}', record._id);
    }

    const modalConfig = currentModal ? config?.modals?.[currentModal] : null;
    const requestBody = action.api.method !== 'GET' 
      ? prepareRequestBody(values, modalConfig)
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
    const modalConfig = currentModal ? config?.modals?.[currentModal] : null;
    const formSection = config?.sections?.find(section => section.type === 'form');
    const action = modalConfig?.actions?.[0] || formSection?.actions?.[0];

    if (action) {
      await handleApiAction(action, values, selectedRecord);
    }
  };

  const handleModalOpen = (modalId, record = null) => {
    const modalConfig = config?.modals?.[modalId];
    setCurrentModal(modalId);
    setSelectedRecord(record);
    setModalVisible(true);
    
    if (record) {
      const formData = transformDataForFields(record, modalConfig?.fields);
      form.setFieldsValue(formData);
    } else {
      form.resetFields();
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

    if (!action?.api || !selectedRecord?._id) {
      message.error('Delete configuration or record is missing');
      return;
    }

    const endpoint = action.api.endpoint.replace('{id}', selectedRecord._id);
    const response = await apiRequest(endpoint, action.api.method);

    if (response) {
      message.success(action.messages?.success || 'Record deleted successfully');
      handleModalClose();
      const formSection = config?.sections?.find(section => section.type === 'form');
      if (formSection?.table?.enabled && formSection?.table?.api) {
        loadTableData(formSection.table.api);
      }
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
  const headerConfig = config.layout?.header;
  const sidebarConfig = config.layout?.sidebar;
  const contentConfig = config.layout?.content;
  const footerConfig = config.layout?.footer;

  return (
    <Layout>
      {headerConfig?.enabled && (
        <Layout.Header 
          style={{
            ...(headerConfig.style || {}),
            position: 'fixed',
            width: '100%',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {headerConfig.logo && (
              <img 
                src={headerConfig.logo} 
                alt="Logo" 
                style={{ height: '32px', marginRight: '24px' }}
              />
            )}
            {sidebarConfig?.enabled && (
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
      
      <Layout style={{ marginTop: headerConfig?.enabled ? 64 : 0 }}>
        {sidebarConfig?.enabled && (
          <SidebarComponent 
            config={config}
            collapsed={collapsed}
            onCollapse={setCollapsed}
          />
        )}
        
        <Layout style={{ 
          transition: 'all 0.2s',
          marginLeft: sidebarConfig?.enabled 
            ? (collapsed ? `${sidebarConfig.collapsedWidth}px` : `${sidebarConfig.width}px`)
            : 0
        }}>
          <Content style={{
            ...(contentConfig?.style || {}),
            minHeight: headerConfig?.enabled ? 'calc(100vh - 64px)' : '100vh',
            padding: 0,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {bannerSection && (
                <div style={{ ...(bannerSection.style || {}) }}>
                  <div style={{ ...(bannerSection.content?.style || {}) }}>
                    {bannerSection.content?.image && (
                      <img 
                        src={bannerSection.content.image} 
                        alt="Banner" 
                        style={{ height: '32px', marginBottom: '12px' }}
                      />
                    )}
                    {bannerSection.content?.title && (
                      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                        {bannerSection.content.title}
                      </h1>
                    )}
                    {bannerSection.content?.description && (
                      <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '4px 0 0 0' }}>
                        {bannerSection.content.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {formSection?.table?.enabled ? (
                <TableComponent
                  config={config}
                  loading={loading}
                  tableData={tableData}
                  onModalOpen={handleModalOpen}
                  onSearch={handleSearch}
                  onFilter={handleFilter}
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

          {footerConfig?.enabled && (
            <Layout.Footer style={{ ...(footerConfig.style || {}), width: '100%' }}>
              {footerConfig.text}
              {footerConfig.links && (
                <div style={{ marginTop: 8 }}>
                  {footerConfig.links.map((link, index) => (
                    <a 
                      key={index} 
                      href={link.url}
                      style={{ marginLeft: index > 0 ? 16 : 0 }}
                    >
                      {link.text}
                    </a>
                  ))}
                </div>
              )}
            </Layout.Footer>
          )}
        </Layout>
      </Layout>

      <ModalComponent
        modalConfig={currentModal ? config.modals?.[currentModal] : null}
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
