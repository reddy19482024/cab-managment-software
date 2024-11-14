// DynamicPage.jsx
import React, { useEffect, useState } from 'react';
import { Layout, Form, Spin, message } from 'antd';
import PropTypes from 'prop-types';
import HeaderComponent from '../Header/Header';
import FooterComponent from '../Footer/Footer';
import ContentLayout from '../Content/Content';
import SidebarComponent from '../Sidebar/Sidebar';
import ModalComponent from '../Modal/Modal';
import configLoader from '../../utils/configLoader';
import useApi from '../../hooks/useApi';

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

  // Load initial page configuration
  useEffect(() => {
    loadPageConfig();
  }, [configName]);

  // Load table data when config, search, or filter params change
  useEffect(() => {
    if (config) {
      const formSection = config.sections?.find(section => section.type === 'form');
      if (formSection?.table?.enabled && formSection?.table?.api) {
        loadTableData(formSection.table.api);
      }
    }
  }, [config, searchParams, filterParams]);

  // Load page configuration from the config loader
  const loadPageConfig = async () => {
    try {
      setPageLoading(true);
      const loadedConfig = await configLoader(configName);
      setConfig(loadedConfig || null);
    } catch (error) {
      console.error("Error loading config:", error);
      message.error('Failed to load page configuration');
    } finally {
      setPageLoading(false);
    }
  };

  // Transform data for form fields based on field configuration
  const transformDataForFields = (data, fields) => {
    const transformedData = { ...data };
    
    fields?.forEach(field => {
      // Handle fields with dependencies (usually relationship fields)
      if (field.dependencies && field.api?.transform) {
        const fieldValue = data[field.name];
        if (fieldValue && typeof fieldValue === 'object') {
          const valueKey = field.api.transform.valueKey;
          transformedData[field.name] = valueKey ? fieldValue[valueKey] : fieldValue;
        }
      }
      
      // Handle nested fields using dataIndex
      if (field.dataIndex && Array.isArray(field.dataIndex)) {
        const value = field.dataIndex.reduce((obj, key) => obj?.[key], data);
        if (value !== undefined) {
          transformedData[field.name] = value;
        }
      }
    });

    return transformedData;
  };

  // Load table data using API configuration
  const loadTableData = async (apiConfig) => {
    if (!apiConfig) return;
  
    const queryParams = {
      ...(apiConfig.params || {}),
      ...searchParams,
      ...filterParams
    };

    try {
      const data = await apiRequest(
        apiConfig.endpoint, 
        apiConfig.method || 'GET',
        null,
        queryParams
      );

      if (data?.data) {
        const formSection = config.sections?.find(section => section.type === 'form');
        const columns = formSection?.table?.columns || [];
        
        // Process data according to column configuration
        const processedData = data.data.map(item => {
          const processedItem = { ...item };
          
          // Process nested fields defined in columns
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
    } catch (error) {
      message.error('Failed to load table data');
      console.error('Error loading table data:', error);
    }
  };

  // Handle search in table
  const handleSearch = (value, fields) => {
    setSearchParams(value ? {
      search: value,
      searchFields: fields.join(',')
    } : {});
  };

  // Handle filters in table
  const handleFilter = (filters) => {
    setFilterParams(Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    ));
  };

  // Prepare request body for API calls
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

      // Handle custom field transformations
      if (field.api?.transform) {
        const fieldValue = values[field.name];
        const valueKey = field.api.transform.valueKey;
        if (fieldValue && valueKey) {
          preparedData[field.name] = fieldValue[valueKey];
        }
      }
    });

    return preparedData;
  };

  // Handle API actions (create, update, delete)
  const handleApiAction = async (action, values, record = null) => {
    if (!action?.api) return;

    try {
      let endpoint = action.api.endpoint;
      if (record?._id) {
        endpoint = endpoint.replace('{id}', record._id);
      }

      const modalConfig = currentModal ? config?.modals?.[currentModal] : null;
      const requestBody = action.api.method !== 'GET' 
        ? prepareRequestBody(values, modalConfig)
        : null;

      const response = await apiRequest(
        endpoint, 
        action.api.method, 
        requestBody
      );

      if (response) {
        message.success(action.messages?.success || 'Operation successful');
        if (currentModal) handleModalClose();
        
        const formSection = config.sections?.find(section => section.type === 'form');
        if (formSection?.table?.enabled && formSection?.table?.api) {
          loadTableData(formSection.table.api);
        }
        form.resetFields();
      }
    } catch (error) {
      message.error(action.messages?.failure || 'Operation failed');
      console.error('API action error:', error);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (values) => {
    const modalConfig = currentModal ? config?.modals?.[currentModal] : null;
    const formSection = config?.sections?.find(section => section.type === 'form');
    const action = modalConfig?.actions?.[0] || formSection?.actions?.[0];

    if (action) {
      await handleApiAction(action, values, selectedRecord);
    }
  };

  // Handle modal opening
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

  // Handle modal closing
  const handleModalClose = () => {
    setModalVisible(false);
    setCurrentModal(null);
    setSelectedRecord(null);
    form.resetFields();
  };

  // Handle sidebar collapse
  const handleSidebarCollapse = (value) => {
    setCollapsed(value);
  };

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!config) return null;

  const headerConfig = config.layout?.header;
  const sidebarConfig = config.layout?.sidebar;

  return (
    <Layout>
      <HeaderComponent 
        config={config} 
        collapsed={collapsed} 
        onCollapse={handleSidebarCollapse} 
      />
      
      <Layout style={{ marginTop: headerConfig?.enabled ? 64 : 0 }}>
        {sidebarConfig?.enabled && (
          <SidebarComponent 
            config={config}
            collapsed={collapsed}
            onCollapse={handleSidebarCollapse}
          />
        )}
        
        <Layout style={{ 
          transition: 'all 0.2s',
          marginLeft: sidebarConfig?.enabled 
            ? (collapsed ? `${sidebarConfig.collapsedWidth}px` : `${sidebarConfig.width}px`)
            : 0
        }}>
          <ContentLayout
            config={config}
            loading={loading}
            tableData={tableData}
            form={form}
            onModalOpen={handleModalOpen}
            onFormSubmit={handleFormSubmit}
            onSearch={handleSearch}
            onFilter={handleFilter}
          />
          
          <FooterComponent config={config} />
        </Layout>
      </Layout>

      <ModalComponent
        modalConfig={currentModal ? config.modals?.[currentModal] : null}
        visible={modalVisible}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        onDelete={handleModalClose}
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