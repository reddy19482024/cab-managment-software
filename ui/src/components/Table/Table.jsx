import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Tag, Tooltip, Modal, Card } from 'antd';
import * as AntdIcons from '@ant-design/icons';
import PropTypes from 'prop-types';
import useApi from '../../hooks/useApi';
import dayjs from 'dayjs';

const { confirm } = Modal;

const TableComponent = ({ section, loading: externalLoading, data: externalData, onModalOpen, onSearch, onFilter, onDelete, onTableChange, pagination: externalPagination }) => {
  const { apiRequest, loading: apiLoading } = useApi();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: section.table.pagination?.pageSize || 10,
    total: 0,
    showSizeChanger: section.table.pagination?.showSizeChanger,
    showQuickJumper: section.table.pagination?.showQuickJumper,
    pageSizeOptions: section.table.pagination?.pageSizeOptions || [10, 20, 50, 100]
  });
  const [relatedData, setRelatedData] = useState({});
  const [currentFilters, setCurrentFilters] = useState({});
  const [currentSorter, setCurrentSorter] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadTableData();
  }, []);

  useEffect(() => {
    if (externalData?.length > 0) {
      setData(externalData);
      loadRelatedData(externalData);
    }
  }, [externalData]);

  const buildQueryParams = (params = {}) => {
    const { api } = section.table;
    const queryParams = new URLSearchParams();

    Object.entries(api.params || {}).forEach(([key, value]) => {
      let paramValue = value;
      
      // Replace template variables
      if (typeof value === 'string') {
        paramValue = value
          .replace('{current}', params.pagination?.current || pagination.current)
          .replace('{pageSize}', params.pagination?.pageSize || pagination.pageSize)
          .replace('{sortField}', params.sorter?.field || '')
          .replace('{sortOrder}', params.sorter?.order || '')
          .replace('{searchText}', params.search || '');

        // Handle filters
        if (params.filters) {
          Object.entries(params.filters).forEach(([filterKey, filterValue]) => {
            paramValue = paramValue.replace(`{filters.${filterKey}}`, filterValue);
          });
        }
      }

      if (paramValue && !paramValue.includes('{')) {
        queryParams.append(key, paramValue);
      }
    });

    return queryParams.toString();
  };

  const loadTableData = async (params = {}) => {
    try {
      setLoading(true);
      const { endpoint } = section.table.api;
      const queryString = buildQueryParams({
        pagination: {
          current: params.pagination?.current || pagination.current,
          pageSize: params.pagination?.pageSize || pagination.pageSize,
        },
        sorter: params.sorter || currentSorter,
        filters: params.filters || currentFilters,
        search: params.search || searchText
      });

      const finalEndpoint = `${endpoint}${queryString ? '?' + queryString : ''}`;
      const response = await apiRequest(finalEndpoint, 'GET');

      if (response?.data) {
        setData(response.data);
        setPagination(prev => ({
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
        const ids = [...new Set(tableData
          .map(item => {
            const value = Array.isArray(column.dataIndex) 
              ? column.dataIndex.reduce((obj, key) => obj?.[key], item)
              : item[column.dataIndex];
            return value;
          })
          .filter(Boolean))];

        if (ids.length === 0) continue;

        const response = await apiRequest(api.endpoint, api.method || 'GET', null, {
          ...(api.params || {}),
          ids: ids.join(',')
        });
        
        if (response?.data) {
          setRelatedData(prev => ({
            ...prev,
            [column.key]: response.data.reduce((acc, item) => {
              acc[item._id] = item;
              return acc;
            }, {})
          }));
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
    if (!column.render) {
      if (Array.isArray(column.dataIndex)) {
        return column.dataIndex.map(key => record[key]).filter(Boolean).join(' ');
      }
      return text;
    }

    switch (column.render.type) {
      case 'tag':
        return (
          <Tag color={column.render.colorMap[text]}>
            {text?.toUpperCase()}
          </Tag>
        );

      case 'datetime':
        return text ? dayjs(text).format(column.render.format || 'YYYY-MM-DD HH:mm') : '-';

      case 'concat':
        return Array.isArray(column.dataIndex)
          ? column.dataIndex.map(key => record[key]).filter(Boolean).join(column.render.separator || ' ')
          : text;

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
      ellipsis: column.ellipsis,
      fixed: column.fixed,
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
    const validSorter = sorter?.field && sorter?.order ? {
      field: sorter.field,
      order: sorter.order === 'descend' ? 'desc' : 'asc'
    } : null;

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
      search: searchText
    };

    setCurrentFilters(validFilters);
    setCurrentSorter(validSorter);

    if (onTableChange) {
      onTableChange(params);
    } else {
      await loadTableData(params);
    }
  };

  const handleSearch = async (value) => {
    const newSearchText = value || '';
    setSearchText(newSearchText);
    
    if (onSearch) {
      onSearch(newSearchText);
    } else {
      const params = {
        pagination: { ...pagination, current: 1 },
        filters: currentFilters,
        sorter: currentSorter,
        search: newSearchText
      };
    
      await loadTableData(params);
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
            onChange={(e) => {
              setSearchText(e.target.value);
              if (section.table.searchConfig.searchOnChange) {
                const timer = setTimeout(() => {
                  handleSearch(e.target.value);
                }, section.table.searchConfig.searchDelay || 500);
                return () => clearTimeout(timer);
              }
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
        scroll={section.table.scroll}
        size={section.table.size}
        rowKey={section.table.rowKey}
      />
    </div>
  );
};

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
          type: PropTypes.oneOf(['tag', 'text', 'actions', 'datetime', 'concat']),
          api: PropTypes.shape({
            endpoint: PropTypes.string,
            method: PropTypes.string,
            params: PropTypes.object
          }),
          colorMap: PropTypes.object,
          template: PropTypes.string,
          fallback: PropTypes.string,
          items: PropTypes.array,
          format: PropTypes.string,
          separator: PropTypes.string
        })
      })).isRequired,
      api: PropTypes.shape({
        endpoint: PropTypes.string.isRequired,
        method: PropTypes.string,
        params: PropTypes.object
      }).isRequired,
      searchConfig: PropTypes.shape({
        placeholder: PropTypes.string,
        fields: PropTypes.arrayOf(PropTypes.string),
        searchOnChange: PropTypes.bool,
        searchDelay: PropTypes.number
      }),
      pagination: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.shape({
          pageSize: PropTypes.number,
          showSizeChanger: PropTypes.bool,
          showQuickJumper: PropTypes.bool,
          showTotal: PropTypes.bool,
          pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
          position: PropTypes.arrayOf(PropTypes.string)
        })
      ]),
      toolbarConfig: PropTypes.shape({
        settings: PropTypes.shape({
          enabled: PropTypes.bool,
          items: PropTypes.arrayOf(PropTypes.string)
        }),
        refresh: PropTypes.shape({
          enabled: PropTypes.bool,
          tooltip: PropTypes.string
        })
      })
    }).isRequired
  }).isRequired,
  actions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    buttonProps: PropTypes.shape({
      type: PropTypes.string,
      icon: PropTypes.string,
      danger: PropTypes.bool,
      size: PropTypes.string
    }),
    onClick: PropTypes.shape({
      type: PropTypes.string,
      modalId: PropTypes.string
    })
  })),
loading: PropTypes.bool,
data: PropTypes.array,
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