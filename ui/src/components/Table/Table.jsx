import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Tag, Tooltip, Modal } from 'antd';
import * as AntdIcons from '@ant-design/icons';
import PropTypes from 'prop-types';
import useApi from '../../hooks/useApi';

const { confirm } = Modal;

const TableComponent = ({ section, loading, data, onModalOpen, onSearch, onFilter, onDelete, onTableChange, pagination }) => {
  const { apiRequest } = useApi();
  const [relatedData, setRelatedData] = useState({});
  const [currentFilters, setCurrentFilters] = useState({});
  const [currentSorter, setCurrentSorter] = useState(null);

  useEffect(() => {
    if (data?.length > 0) {
      loadRelatedData();
    }
  }, [data]);

  const loadRelatedData = async () => {
    try {
      const columnsNeedingData = section.table.columns.filter(col => 
        col.render?.api && col.render?.type === 'text'
      );

      for (const column of columnsNeedingData) {
        const { api } = column.render;
        
        // Get unique IDs from the data for this column
        const columnKey = Array.isArray(column.dataIndex) ? column.dataIndex[0] : column.dataIndex;
        const ids = [...new Set(data
          .map(item => item[columnKey])
          .filter(Boolean))];

        if (ids.length === 0) continue;

        let endpoint = api.endpoint;
        const queryParams = new URLSearchParams();
        
        // Handle params for GET request
        if (!api.method || api.method === 'GET') {
          Object.entries(api.params || {}).forEach(([key, value]) => {
            if (typeof value === 'string' && value.includes('{')) {
              value = value.replace(/\{(\w+)\}/g, (match, key) => {
                if (key === 'vehicleIds') return ids.join(',');
                return match;
              });
            }
            queryParams.append(key, value);
          });
          if (queryParams.toString()) {
            endpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryParams.toString()}`;
          }
          
          const response = await apiRequest(endpoint);
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
      }
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

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
      sorter: column.sorter && ((a, b) => {
        const aValue = Array.isArray(column.dataIndex) 
          ? column.dataIndex.reduce((obj, key) => obj?.[key], a)
          : a[column.dataIndex];
        const bValue = Array.isArray(column.dataIndex)
          ? column.dataIndex.reduce((obj, key) => obj?.[key], b)
          : b[column.dataIndex];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return aValue - bValue;
        }
        return String(aValue || '').localeCompare(String(bValue || ''));
      }),
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
    setCurrentFilters(filters);
    setCurrentSorter(sorter);

    if (onTableChange) {
      const { endpoint, method = 'GET', params = {} } = section.table.api;
      const queryParams = new URLSearchParams();

      // Add pagination
      if (paginationParams) {
        queryParams.append('page', paginationParams.current);
        queryParams.append('limit', paginationParams.pageSize);
      }

      // Add sorting
      if (sorter?.order) {
        const sortOrder = sorter.order === 'ascend' ? '' : '-';
        queryParams.append('sort', `${sortOrder}${sorter.field}`);
      }

      // Add filters
      Object.entries(filters).forEach(([key, values]) => {
        if (values?.length) {
          queryParams.append(key, values.join(','));
        }
      });

      // Add configured params
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value);
      });

      const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryParams.toString()}`;
      onTableChange(url, paginationParams, filters, sorter);
    }
  };

  const handleSearch = (value) => {
    if (onSearch && section.table.searchConfig) {
      const { endpoint } = section.table.api;
      const searchFields = section.table.searchConfig.fields;
      const queryParams = new URLSearchParams();

      if (value) {
        searchFields.forEach(field => {
          queryParams.append(field, value);
        });
      }

      const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryParams.toString()}`;
      onSearch(url, value);
    }
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
            style={{ width: 300 }}
            allowClear
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
        loading={loading}
        onChange={handleTableChange}
        pagination={
          section.table.pagination === false
            ? false
            : {
                ...section.table.pagination,
                current: pagination?.current,
                pageSize: pagination?.pageSize,
                total: pagination?.total,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
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