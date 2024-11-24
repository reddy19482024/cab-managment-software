import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Tag, Tooltip, Modal } from 'antd';
import * as AntdIcons from '@ant-design/icons';
import PropTypes from 'prop-types';
import useApi from '../../hooks/useApi';

const { confirm } = Modal;

const TableComponent = ({ section, loading: externalLoading, data: externalData, onModalOpen, onSearch, onFilter, onDelete, onTableChange, pagination: externalPagination }) => {
  const { apiRequest, loading: apiLoading } = useApi();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: section.table.pagination?.pageSize || 10,
    total: 0
  });
  const [relatedData, setRelatedData] = useState({});
  const [currentFilters, setCurrentFilters] = useState({});
  const [currentSorter, setCurrentSorter] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Initial data loading
  useEffect(() => {
    loadTableData();
  }, []);

  // Update data when external data changes
  useEffect(() => {
    if (externalData?.length > 0) {
      setData(externalData);
      loadRelatedData(externalData);
    }
  }, [externalData]);

  const buildQueryParams = (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add pagination parameters
    if (params.pagination) {
      if (params.pagination.current) {
        queryParams.append('page', params.pagination.current);
      }
      if (params.pagination.pageSize) {
        queryParams.append('limit', params.pagination.pageSize);
      }
    }

    // Add sorter parameters only if they exist and are valid
    if (params.sorter?.field && params.sorter?.order) {
      queryParams.append('sort_by', params.sorter.field);
      queryParams.append('sort_order', params.sorter.order);
    }

    // Add filter parameters only if they have actual values
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          // Only add filter if it has actual values and isn't a placeholder
          const validValues = value.filter(v => !v.includes('{') && v.trim() !== '');
          if (validValues.length > 0) {
            queryParams.append(`filters[${key}]`, validValues.join(','));
          }
        } else if (value && typeof value === 'string' && !value.includes('{')) {
          queryParams.append(`filters[${key}]`, value);
        }
      });
    }

    // Add search parameter if it exists and isn't empty
    if (params.search?.trim()) {
      queryParams.append('search', params.search.trim());
    }

    return queryParams.toString();
  };

  const loadTableData = async (params = {}) => {
    try {
      setLoading(true);
      const { endpoint } = section.table.api;

      // Build clean query parameters
      const queryString = buildQueryParams({
        pagination: {
          current: params.pagination?.current || pagination.current,
          pageSize: params.pagination?.pageSize || pagination.pageSize,
        },
        sorter: params.sorter || currentSorter,
        filters: params.filters || currentFilters,
        search: params.search || searchText
      });

      // Construct the final endpoint
      const finalEndpoint = `${endpoint}${queryString ? '?' + queryString : ''}`;

      // Make API request
      const response = await apiRequest(finalEndpoint, 'GET');

      if (response?.data) {
        setData(response.data);
        setPagination((prev) => ({
          ...prev,
          current: params.pagination?.current || prev.current,
          pageSize: params.pagination?.pageSize || prev.pageSize,
          total: response.total || response.data.length,
        }));
        await loadRelatedData(response.data);
      }
    } catch (error) {
      console.error('Error loading table data:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const loadRelatedData = async (tableData) => {
    try {
      const columnsNeedingData = section.table.columns.filter(col => 
        col.render?.api && col.render?.type === 'text'
      );

      for (const column of columnsNeedingData) {
        const { api } = column.render;
        const columnKey = Array.isArray(column.dataIndex) ? column.dataIndex[0] : column.dataIndex;
        const ids = [...new Set(tableData
          .map(item => item[columnKey])
          .filter(Boolean))];

        if (ids.length === 0) continue;

        const params = {
          ...(api.params || {}),
          ids: ids.join(',')
        };

        const response = await apiRequest(api.endpoint, api.method || 'GET', null, params);
        
        if (response?.data) {
          const mappedData = response.data.reduce((acc, item) => {
            acc[item._id] = item;
            return acc;
          }, {});
          setRelatedData(prev => ({
            ...prev,
            [column.key]: mappedData
          }));
        }
      }
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

  
  // Rest of your component code (getIcon, handleDelete, renderColumnContent) remains the same...
    
  const getIcon = (iconName) => {
    const Icon = AntdIcons[iconName];
    return Icon ? React.createElement(Icon) : null;
  };

  const handleDelete = (record, modalId) => {
  confirm({
      title: 'Are you sure you want to delete this item?',
      icon: React.createElement(AntdIcons.ExclamationCircleOutlined),
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        onDelete(modalId, record);
      }
    });
  };

  const renderColumnContent = (column, text, record) => {
    if (!column.render) return text;

    switch (column.render.type) {
      case 'tag':
        return (
          <Tag color={column.render.colorMap[text]}>
            {text?.toUpperCase()}
          </Tag>
        );

      case 'text': {
        const relatedItem = text && column.render.api ? 
          relatedData[column.key]?.[text] : text;

        if (!relatedItem && column.render.fallback) {
          return column.render.fallback;
        }

        if (column.render.template && relatedItem) {
          return column.render.template.replace(
            /\${(\w+)}/g,
            (_, key) => relatedItem[key] || ''
          ).trim() || column.render.fallback;
        }

        return text;
      }

      case 'actions':
        return (
          <Space>
            {column.render.items.map((action, idx) => (
              <Tooltip key={idx} title={action.tooltip}>
                <Button
                  {...action.buttonProps}
                  icon={action.buttonProps.icon && getIcon(action.buttonProps.icon)}
                  onClick={() => {
                    if (action.onClick?.type === 'modal') {
                      if (action.buttonProps.danger) {
                        handleDelete(record, action.onClick.modalId);
                      } else {
                        onModalOpen(action.onClick.modalId, record);
                      }
                    }
                  }}
                />
              </Tooltip>
            ))}
          </Space>
        );

      default:
        if (Array.isArray(column.dataIndex)) {
          return column.dataIndex.reduce((obj, key) => obj?.[key], record) || '-';
        }
        return text;
    }
  };

  const getColumns = () => {
    return section.table.columns.map(column => ({
      ...column,
      render: (text, record) => renderColumnContent(column, text, record),
      filteredValue: currentFilters[column.dataIndex],
      sortOrder: currentSorter?.columnKey === column.key ? currentSorter.order : null,
      sorter: column.sorter,
      sortField: column.sortField,
      filters: column.filters,
      filterMode: column.filterMode || 'menu',
      filterSearch: column.filterSearch,
      onFilter: column.filters && ((value, record) => {
        const recordValue = Array.isArray(column.dataIndex)
          ? column.dataIndex.reduce((obj, key) => obj?.[key], record)
          : record[column.dataIndex];
        return String(recordValue || '').toLowerCase().includes(String(value).toLowerCase());
      })
    }));
  };

  const handleTableChange = async (paginationParams, filters, sorter) => {
    // Only include valid sorter information
    const validSorter = sorter?.field && sorter?.order ? {
      field: sorter.field,
      order: sorter.order === 'descend' ? 'desc' : 'asc'
    } : null;

    // Clean filters to remove any placeholders or empty values
    const validFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const cleanValues = value.filter(v => v && !v.includes('{'));
        if (cleanValues.length > 0) {
          validFilters[key] = cleanValues;
        }
      } else if (value && !value.includes('{')) {
        validFilters[key] = value;
      }
    });

    const params = {
      pagination: paginationParams,
      filters: validFilters,
      sorter: validSorter,
      search: searchText.trim()
    };

    setCurrentFilters(validFilters);
    setCurrentSorter(validSorter);

    await loadTableData(params);
  };

  const handleSearch = async (value) => {
    const newSearchText = value || ''; // Handle empty string case
    setSearchText(newSearchText);
    
    const params = {
      pagination: { ...pagination, current: 1 }, // Reset to first page
      filters: currentFilters,
      sorter: currentSorter,
      search: newSearchText // This will be empty string when cleared
    };
  
    await loadTableData(params);
  };
  const renderToolbar = () => (
    <div style={{
      marginBottom: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <div>
        <h2 style={{ margin: 0 }}>{section.title}</h2>
        {section.subtitle && (
          <p style={{ color: 'rgba(0, 0, 0, 0.45)', margin: '4px 0 0' }}>
            {section.subtitle}
          </p>
        )}
      </div>
  
      <Space wrap>
        {section.table.searchConfig && (
          <Input.Search
            placeholder={section.table.searchConfig.placeholder}
            onSearch={handleSearch}
            onChange={(e) => {
              setSearchText(e.target.value);
              // Optional: Add debounced search here if you want to search while typing
            }}
            value={searchText}
            style={{ width: 300 }}
            allowClear
            onClear={() => handleSearch('')}
            prefix={getIcon('SearchOutlined')}
          />
        )}
  
        {section.actions?.map((action, index) => (
          <Button
            key={index}
            {...action.buttonProps}
            icon={action.buttonProps.icon && getIcon(action.buttonProps.icon)}
            onClick={() => {
              if (action.onClick?.type === 'modal') {
                onModalOpen(action.onClick.modalId);
              }
            }}
          >
            {action.label}
          </Button>
        ))}
      </Space>
    </div>
  );

  return (
    <div style={{ 
      ...section.containerStyle,
      background: '#fff',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
    }}>
      {renderToolbar()}
      
      <Table
        {...section.table}
        columns={getColumns()}
        dataSource={data}
        loading={loading || externalLoading || apiLoading}
        onChange={handleTableChange}
        pagination={
          section.table.pagination === false
            ? false
            : {
                ...section.table.pagination,
                ...pagination,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                position: section.table.pagination.position || ['bottomRight']
              }
        }
      />
    </div>
  );
};

// PropTypes remain the same but updated to match new configuration
TableComponent.propTypes = {
  section: PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,
    containerStyle: PropTypes.object,
    table: PropTypes.shape({
      enabled: PropTypes.bool,
      rowKey: PropTypes.string,
      size: PropTypes.oneOf(['small', 'middle', 'large']),
      scroll: PropTypes.object,
      columns: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string.isRequired,
        dataIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
        key: PropTypes.string.isRequired,
        width: PropTypes.string,
        fixed: PropTypes.oneOf(['left', 'right']),
        sorter: PropTypes.bool,
        render: PropTypes.shape({
          type: PropTypes.oneOf(['tag', 'text', 'actions']),
          api: PropTypes.shape({
            endpoint: PropTypes.string,
            method: PropTypes.string,
            params: PropTypes.object
          }),
          colorMap: PropTypes.object,
          template: PropTypes.string,
          fallback: PropTypes.string,
          items: PropTypes.array
        })
      })).isRequired,
      api: PropTypes.shape({
        endpoint: PropTypes.string.isRequired,
        method: PropTypes.string,
        params: PropTypes.object
      }),
      searchConfig: PropTypes.shape({
        placeholder: PropTypes.string,
        fields: PropTypes.arrayOf(PropTypes.string)
      }),
      pagination: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.shape({
          pageSize: PropTypes.number,
          showSizeChanger: PropTypes.bool,
          showQuickJumper: PropTypes.bool,
          showTotal: PropTypes.bool
        })
      ])
    }).isRequired
  }).isRequired,
  loading: PropTypes.bool,
  data: PropTypes.array.isRequired,
  onModalOpen: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  onFilter: PropTypes.func,
  onDelete: PropTypes.func.isRequired,
  onTableChange: PropTypes.func,
  pagination: PropTypes.shape({
    current: PropTypes.number,
    pageSize: PropTypes.number,
    total: PropTypes.number
  })
};

TableComponent.defaultProps = {
  loading: false,
  data: [],
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0
  }
};

export default TableComponent;