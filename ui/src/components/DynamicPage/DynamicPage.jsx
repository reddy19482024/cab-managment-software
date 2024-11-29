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

  // Core state
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
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [currentSorter, setCurrentSorter] = useState(null);

  const { apiRequest, loading } = useApi();
  const currentPath = useMemo(() => location.pathname, [location]);

  // Load configuration and table data effects remain unchanged
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
  }, [config, searchParams, filterParams, currentPage, pageSize, currentSorter]);

  // Existing loadPageConfig and loadTableData functions remain unchanged...
  const loadPageConfig = async () => {
    try {
      setPageLoading(true);
      const loadedConfig = await configLoader(configName);
  
      // Handle layout import
      if (loadedConfig.layout === '@import: ./layout.json') {
        const layoutConfig = await configLoader('layout');
        loadedConfig.layout = layoutConfig;
      }
  
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
      // Create a new URLSearchParams object for query parameters
      const queryParams = new URLSearchParams();
  
      // Add pagination parameters
      queryParams.append('page', currentPage);
      queryParams.append('limit', pageSize);
  
      // Only add offset if it's needed by your API
      // queryParams.append('offset', (currentPage - 1) * pageSize);
  
      // Process filters - only add if they have real values (not placeholders)
      Object.entries(filterParams).forEach(([key, values]) => {
        if (values && Array.isArray(values) && values.length > 0) {
          // Filter out any placeholder values that contain '{' or '}'
          const cleanValues = values.filter(value => 
            typeof value === 'string' && !value.includes('{') && !value.includes('}')
          );
          if (cleanValues.length > 0) {
            queryParams.append(`filters[${key}]`, cleanValues.join(','));
          }
        } else if (values && typeof values === 'string' && !values.includes('{')) {
          queryParams.append(`filters[${key}]`, values);
        }
      });
  
      // Add search parameters if they exist
      if (searchParams.search) {
        queryParams.append('search', searchParams.search);
        if (searchParams.searchFields) {
          queryParams.append('searchFields', searchParams.searchFields);
        }
      }
  
      // Add sorting parameters if they exist and are not placeholders
      if (currentSorter?.field && currentSorter?.order) {
        const sortOrder = currentSorter.order === 'descend' ? 'desc' : 'asc';
        // Only add if not a placeholder
        if (!sortOrder.includes('{')) {
          queryParams.append('sort_order', sortOrder);
        }
        if (!currentSorter.field.includes('{')) {
          queryParams.append('sort_by', currentSorter.field);
        }
      }
  
      // Add any additional API params from config, filtering out placeholders
      if (apiConfig.params) {
        Object.entries(apiConfig.params).forEach(([key, value]) => {
          if (value && typeof value === 'string' && !value.includes('{')) {
            queryParams.append(key, value);
          }
        });
      }
  
      // Construct the final endpoint
      const queryString = queryParams.toString();
      const endpoint = `${apiConfig.endpoint}${queryString ? '?' + queryString : ''}`;
  
      const response = await apiRequest(endpoint, apiConfig.method || 'GET');
  
      if (response?.data) {
        const items = response.data.items || response.data || [];
        const total = response.data.total || items.length;
  
        setTableData(
          items.map((item) => ({
            key: item._id || item.id,
            ...item,
          }))
        );
        setTotalRecords(total);
      }
    } catch (error) {
      console.error('Error loading table data:', error);
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

    if (record && modalConfig.fields) {
      // Transform record data for form fields dynamically
      const formData = modalConfig.fields.reduce((acc, field) => {
        let value = record[field.name];

        // Handle select fields with labelInValue
        if (field.type === 'select' && value !== undefined) {
          // Get label from either a specified label field or use value as fallback
          const label = record[`${field.name}_label`] || 
                       field.labelField && record[field.labelField] || 
                       value;
          
          acc[field.name] = {
            label: label,
            value: value
          };
        } else {
          acc[field.name] = value;
        }
        return acc;
      }, {});

      form.setFieldsValue(formData);
    }
  };

  const handleFormSubmit = async (values) => {
    const modalConfig = config.modals[currentModal];
    const submitAction = modalConfig.actions?.find(act => 
      act.buttonProps?.htmlType === 'submit'
    );

    if (!submitAction?.api) return;

    try {
      let endpoint = submitAction.api.endpoint;
      const method = submitAction.api.method;

      // Handle dynamic ID replacement in URL
      if (selectedRecord) {
        const idField = Object.keys(selectedRecord).find(key => 
          key === 'id' || key === '_id'
        );
        if (idField) {
          endpoint = endpoint.replace('{id}', selectedRecord[idField]);
        }
      }

      // Transform form values for API
      const transformedValues = Object.entries(values).reduce((acc, [key, value]) => {
        // Handle different value types
        if (value === null || value === undefined) {
          return acc;
        }

        if (typeof value === 'object') {
          if (value.value !== undefined) {
            // Handle select values
            acc[key] = value.value;
          } else if (Array.isArray(value)) {
            // Handle array values
            acc[key] = value.map(v => v?.value !== undefined ? v.value : v);
          } else if (value._isAMomentObject) {
            // Handle date values
            acc[key] = value.toISOString();
          } else {
            // Handle other object values
            acc[key] = value;
          }
        } else {
          // Handle primitive values
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await apiRequest(endpoint, method, transformedValues);

      if (response) {
        message.success(submitAction.messages?.success || 'Operation completed successfully');
        handleModalClose();
        
        // Reload table data if exists
        const formSection = config.sections?.find(s => s.type === 'form');
        if (formSection?.table?.enabled && formSection?.table?.api) {
          await loadTableData(formSection.table.api);
        }
      }
    } catch (error) {
      // Error handled by useApi
    }
  };

  // Other handlers remain unchanged...
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
  // Render logic remains unchanged...

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
      />
    </Layout>
  );
};

DynamicPage.propTypes = {
  configName: PropTypes.string.isRequired
};

export default DynamicPage;