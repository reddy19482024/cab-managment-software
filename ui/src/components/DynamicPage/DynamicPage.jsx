// src/components/dynamic/DynamicPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Layout, Form, Spin, message, theme } from 'antd';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import HeaderComponent from '../Header/Header';
import FooterComponent from '../Footer/Footer';
import ContentLayout from '../Content/Content';
import SidebarComponent from '../Sidebar/Sidebar';
import ModalComponent from '../Modal/Modal';
import configLoader from '../../utils/configLoader';
import useApi from '../../hooks/useApi';

const DynamicPage = ({ configName }) => {
  const { token } = theme.useToken();
  const location = useLocation();
  const navigate = useNavigate();

  // State Management
  const [config, setConfig] = useState(null);
  const [form] = Form.useForm();
  const [pageLoading, setPageLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentModal, setCurrentModal] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [searchParams, setSearchParams] = useState({});
  const [filterParams, setFilterParams] = useState({});
  const [dependentFieldsData, setDependentFieldsData] = useState({});
  const [fieldLoading, setFieldLoading] = useState({});
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [currentSorter, setCurrentSorter] = useState(null);

  const { apiRequest, loading } = useApi();
  const currentPath = useMemo(() => location.pathname, [location]);

  // Load configuration
  useEffect(() => {
    loadPageConfig();
  }, [configName]);

  // Load table data when params change
  useEffect(() => {
    if (config) {
      const formSection = config.sections?.find(section => section.type === 'form');
      if (formSection?.table?.enabled && formSection?.table?.api) {
        loadTableData(formSection.table.api);
      }
    }
  }, [config, searchParams, filterParams, currentPage, pageSize, currentSorter]);

  const loadPageConfig = async () => {
    try {
      setPageLoading(true);
      const loadedConfig = await configLoader(configName);
      setConfig(loadedConfig);

      const formSection = loadedConfig.sections?.find(section => section.type === 'form');
      if (formSection?.table?.pagination?.pageSize) {
        setPageSize(formSection.table.pagination.pageSize);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      message.error('Failed to load page configuration');
    } finally {
      setPageLoading(false);
    }
  };

  const loadTableData = async (apiConfig) => {
    try {
      // Process filters
      const processedFilters = {};
      Object.entries(filterParams).forEach(([key, values]) => {
        if (values && values.length > 0) {
          processedFilters[`filters[${key}]`] = values.join(',');
        }
      });
  
      // Process search
      const searchQuery = searchParams.search ? {
        search: searchParams.search,
        searchFields: searchParams.searchFields
      } : {};
  
      // Process sorting
      const sortParam = currentSorter?.field ? {
        sort: `${currentSorter.order === 'descend' ? '-' : ''}${currentSorter.field}`
      } : {};
  
      // Prepare params
      const queryParams = new URLSearchParams({
        ...(apiConfig.params || {}),
        ...processedFilters,
        ...searchQuery,
        ...sortParam,
        page: currentPage,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize // Add offset for proper pagination
      }).toString();
  
      const endpoint = `${apiConfig.endpoint}${queryParams ? '?' + queryParams : ''}`;
      
      const response = await apiRequest(
        endpoint,
        apiConfig.method || 'GET'
      );
  
      if (response?.data) {
        const items = response.data.items || response.data || [];
        const total = response.data.total || items.length;
  
        setTableData(items.map(item => ({
          key: item._id || item.id,
          ...item
        })));
        setTotalRecords(total);
      }
    } catch (error) {
      // Error handled by useApi
    }
  };

  const loadDependentFieldData = async (field, params = {}, currentValue = null) => {
    if (!field.api) return;

    try {
      setFieldLoading(prev => ({ ...prev, [field.name]: true }));

      // Get values of all dependencies
      const dependencyValues = field.dependencies?.reduce((acc, dep) => {
        const value = form.getFieldValue(dep);
        if (value?.value !== undefined) {
          acc[dep] = value.value;
        } else {
          acc[dep] = value;
        }
        return acc;
      }, {});

      // Skip loading if required dependencies are not met
      if (field.dependencies?.some(dep => !dependencyValues[dep])) {
        setDependentFieldsData(prev => ({
          ...prev,
          [field.name]: []
        }));
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        ...(field.api.params || {}),
        ...params,
        ...dependencyValues,
        ...(currentValue && field.api.transform?.includeCurrentValue && {
          includeIds: Array.isArray(currentValue) ? currentValue.join(',') : currentValue
        })
      }).toString();

      const endpoint = `${field.api.endpoint}${queryParams ? '?' + queryParams : ''}`;
      
      const response = await apiRequest(
        endpoint,
        field.api.method || 'GET'
      );

      if (response?.data) {
        const data = response.data.items || response.data || [];
        const options = transformOptionsData(data, field.api.transform);
        setDependentFieldsData(prev => ({
          ...prev,
          [field.name]: options
        }));
      }
    } catch (error) {
      // Error handled by useApi
      setDependentFieldsData(prev => ({
        ...prev,
        [field.name]: []
      }));
    } finally {
      setFieldLoading(prev => ({ ...prev, [field.name]: false }));
    }
  };

  const handleModalOpen = async (modalId, record = null) => {
    const modalConfig = config.modals[modalId];
    setCurrentModal(modalId);
    setSelectedRecord(record);
    setModalVisible(true);
    
    form.resetFields();
    setDependentFieldsData({});
    setFieldLoading({});
    
    if (modalConfig.fields) {
      // Load independent fields first
      const independentFields = modalConfig.fields.filter(field => 
        field.api && !field.dependencies
      );
      
      for (const field of independentFields) {
        await loadDependentFieldData(field);
      }

      // For edit mode
      if (record) {
        const formData = {};
        modalConfig.fields.forEach(field => {
          let value;
          if (Array.isArray(field.dataIndex)) {
            value = field.dataIndex.reduce((obj, key) => obj?.[key], record);
          } else {
            value = record[field.name || field.dataIndex];
          }
          
          // Transform value for select fields if needed
          if (field.type === 'select' && value !== undefined) {
            formData[field.name] = {
              label: record[`${field.name}_label`] || value,
              value: value
            };
          } else {
            formData[field.name] = value;
          }
        });

        form.setFieldsValue(formData);

        // Load dependent fields with current values
        const dependentFields = modalConfig.fields.filter(field => 
          field.api && (field.dependencies || field.watchConfig)
        );

        for (const field of dependentFields) {
          const currentValue = formData[field.name];
          if (currentValue) {
            await loadDependentFieldData(field, {}, 
              currentValue.value !== undefined ? currentValue.value : currentValue
            );
          }
        }
      }
    }
  };

  const handleFormSubmit = async (values) => {
    const modalConfig = config.modals[currentModal];
    const action = modalConfig.actions.find(act => 
      act.buttonProps?.htmlType === 'submit'
    );

    if (!action?.api) return;

    try {
      let endpoint = action.api.endpoint;
      const method = action.api.method;

      // Replace URL parameters for edit mode
      if (selectedRecord?._id) {
        endpoint = endpoint.replace('{id}', selectedRecord._id);
      }

      // Transform values for API
      const transformedValues = Object.entries(values).reduce((acc, [key, value]) => {
        // Handle select fields
        if (value?.value !== undefined) {
          acc[key] = value.value;
        }
        // Handle date fields
        else if (value?._isAMomentObject) {
          acc[key] = value.toISOString();
        }
        // Handle array fields
        else if (Array.isArray(value)) {
          acc[key] = value.map(v => v?.value !== undefined ? v.value : v);
        }
        // Handle other fields
        else {
          acc[key] = value;
        }
        return acc;
      }, {});

      // Add ID fields for update operations
      if (selectedRecord && method.toUpperCase() === 'PUT') {
        transformedValues._id = selectedRecord._id;
        transformedValues.id = selectedRecord.id;
      }

      const response = await apiRequest(
        endpoint,
        method,
        transformedValues
      );

      if (response) {
        message.success(action.messages?.success || 'Operation completed successfully');
        handleModalClose();
        
        // Reload table data
        const formSection = config.sections.find(s => s.type === 'form');
        if (formSection?.table?.enabled && formSection?.table?.api) {
          await loadTableData(formSection.table.api);
        }
      }
    } catch (error) {
      // Error handled by useApi
    }
  };

  const handleDelete = async (modalId, record) => {
    try {
      const modalConfig = config.modals[modalId];
      const deleteAction = modalConfig.actions.find(action => 
        action.buttonProps?.danger
      );
      
      if (!deleteAction?.api) return;

      let endpoint = deleteAction.api.endpoint;
      
      if (record._id) {
        endpoint = endpoint.replace('{id}', record._id);
      }

      const response = await apiRequest(
        endpoint,
        deleteAction.api.method || 'DELETE'
      );

      if (response) {
        message.success(deleteAction.messages?.success || 'Successfully deleted');
        
        // If we're on a page with no items after deletion, go to previous page
        if (tableData.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
        
        // Reload table data
        const formSection = config.sections.find(s => s.type === 'form');
        if (formSection?.table?.enabled && formSection?.table?.api) {
          await loadTableData(formSection.table.api);
        }
      }
    } catch (error) {
      // Error handled by useApi
    }
  };

  const handleSearch = (value) => {
    const formSection = config.sections.find(s => s.type === 'form');
    setSearchParams(value ? {
      search: value,
      searchFields: formSection.table.searchConfig.fields.join(',')
    } : {});
    setCurrentPage(1);
  };

  const handleFilter = (filters) => {
    setFilterParams(filters);
    setCurrentPage(1);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    // Update page and size
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
    
    // Update sorter
    setCurrentSorter(sorter);
    
    // Update filters
    const processedFilters = {};
    Object.entries(filters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        processedFilters[key] = values;
      }
    });
    setFilterParams(processedFilters);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setCurrentModal(null);
    setSelectedRecord(null);
    form.resetFields();
    setDependentFieldsData({});
    setFieldLoading({});
  };

  const handleFieldWatch = (changedValues, allValues) => {
    if (!currentModal) return;

    const modalConfig = config.modals[currentModal];
    modalConfig.fields?.forEach(field => {
      if (field.watchConfig) {
        Object.entries(field.watchConfig).forEach(([key, config]) => {
          const watchValue = allValues[config.field];
          
          if (watchValue && config.conditions?.[watchValue]) {
            const condition = config.conditions[watchValue];
            
            switch (condition.action) {
              case 'RELOAD_OPTIONS':
                loadDependentFieldData(field, condition.params);
                break;
              case 'CLEAR_VALUE':
                form.setFieldValue(field.name, undefined);
                break;
              case 'VALIDATE':
                form.validateFields([field.name]);
                break;
            }
          }
        });
      }
    });
  };

  const handleSidebarCollapse = (value) => {
    setCollapsed(value);
  };

  if (pageLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: token.colorBgContainer
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {config.layout.header.enabled && (
        <HeaderComponent 
          config={config.layout.header}
          collapsed={collapsed}
          onCollapse={handleSidebarCollapse}
        />
      )}
      
      <Layout hasSider>
        {config.layout.sidebar.enabled && (
          <SidebarComponent 
            config={config}
            collapsed={collapsed}
            onCollapse={handleSidebarCollapse}
            currentPath={currentPath}
          />
        )}
        
        <Layout style={{
          marginLeft: collapsed 
            ? config.layout.sidebar.collapsedWidth 
            : config.layout.sidebar.width,
          marginTop: config.layout.header.enabled ? '64px' : 0,
          transition: 'all 0.2s',
          background: token.colorBgContainer
        }}>
     <ContentLayout
        config={config}
        loading={loading}
        tableData={tableData}
        form={form}
        onModalOpen={handleModalOpen}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onDelete={handleDelete}
        onTableChange={handleTableChange}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalRecords,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
        }}
      />
          
          {config.layout.footer.enabled && (
            <FooterComponent config={config.layout.footer} />
          )}
        </Layout>
      </Layout>

      <ModalComponent
        config={currentModal ? config.modals[currentModal] : null}
        visible={modalVisible}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        loading={loading}
        form={form}
        record={selectedRecord}
        dependentFieldsData={dependentFieldsData}
        fieldLoading={fieldLoading}
        onFieldWatch={handleFieldWatch}
      />
    </Layout>
  );
};

DynamicPage.propTypes = {
  configName: PropTypes.string.isRequired
};

export default DynamicPage;