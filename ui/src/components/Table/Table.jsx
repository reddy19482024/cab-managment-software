// src/components/Table/TableComponent.jsx
import React, { useState } from 'react';
import { Table, Button, Space, Input, Tag, Tooltip, Modal } from 'antd';
import { 
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import * as AntdIcons from '@ant-design/icons';
import PropTypes from 'prop-types';

const { confirm } = Modal;

const TableComponent = ({
  section,
  loading,
  data,
  onModalOpen,
  onSearch,
  onFilter,
  onDelete,
  onTableChange,
  pagination
}) => {
  const [currentFilters, setCurrentFilters] = useState({});
  const [currentSorter, setCurrentSorter] = useState(null);

  // Helper function to get icon component
  const getIcon = (iconName) => {
    if (!iconName) return null;
    if (iconName === 'EditOutlined') return <EditOutlined />;
    if (iconName === 'DeleteOutlined') return <DeleteOutlined />;
    if (iconName === 'PlusOutlined') return <PlusOutlined />;
    if (iconName === 'SearchOutlined') return <SearchOutlined />;
    
    const Icon = AntdIcons[iconName];
    return Icon ? <Icon /> : null;
  };

  // Handle delete confirmation
  const handleDelete = (record, modalId) => {
    confirm({
      title: 'Are you sure you want to delete this item?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        onDelete(modalId, record);
      }
    });
  };

  // Handle column rendering based on configuration
  const renderColumnContent = (column, text, record) => {
    if (!column.render) return text;

    switch (column.render.type) {
      case 'tag':
        return (
          <Tag color={column.render.colorMap[text]}>
            {text?.toUpperCase()}
          </Tag>
        );

      case 'text':
        if (!text && column.render.fallback) {
          return column.render.fallback;
        }
        if (column.render.template && Array.isArray(column.dataIndex)) {
          const nestedValue = column.dataIndex.reduce((obj, key) => obj?.[key], record);
          if (nestedValue) {
            return column.render.template.replace(
              /\${(\w+)}/g,
              (_, key) => nestedValue[key] || column.render.fallback || ''
            );
          }
          return column.render.fallback || '-';
        }
        return text;

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
                >
                  {action.buttonProps.label}
                </Button>
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

  // Process columns configuration
  const getColumns = () => {
    return section.table.columns.map(column => ({
      ...column,
      render: (text, record) => renderColumnContent(column, text, record),
      filteredValue: currentFilters[column.dataIndex],
      sortOrder: currentSorter?.columnKey === column.key ? currentSorter.order : null,
      // Handle nested object sorting
      sorter: column.sorter && ((a, b) => {
        const aValue = Array.isArray(column.dataIndex) 
          ? column.dataIndex.reduce((obj, key) => obj?.[key], a)
          : a[column.dataIndex];
        const bValue = Array.isArray(column.dataIndex)
          ? column.dataIndex.reduce((obj, key) => obj?.[key], b)
          : b[column.dataIndex];
        
        // Handle different types of values
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return aValue - bValue;
        }
        return String(aValue || '').localeCompare(String(bValue || ''));
      }),
      // Add filters if specified in column config
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

  // Handle table change (sorting, filtering, pagination)
  const handleTableChange = (paginationParams, filters, sorter) => {
    setCurrentFilters(filters);
    setCurrentSorter(sorter);

    if (onTableChange) {
      onTableChange(paginationParams, filters, sorter);
    }
  };

  // Handle search
  const handleSearch = (value) => {
    if (onSearch) {
      onSearch(value);
    }
  };

  // Render the toolbar section
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
            placeholder={section.table.searchConfig.placeholder || 'Search...'}
            onSearch={handleSearch}
            style={{ width: 300 }}
            allowClear
            prefix={<SearchOutlined />}
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
        columns={getColumns()}
        dataSource={data}
        loading={loading}
        onChange={handleTableChange}
        rowKey={section.table.rowKey || '_id'}
        pagination={
          section.table.pagination === false
            ? false
            : {
                ...section.table.pagination,
                current: pagination?.current,
                pageSize: pagination?.pageSize,
                total: pagination?.total,
                showSizeChanger: section.table.pagination?.showSizeChanger ?? true,
                showQuickJumper: section.table.pagination?.showQuickJumper ?? true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
              }
        }
        scroll={section.table.scroll}
        size={section.table.size || 'middle'}
        bordered={section.table.bordered}
        rowSelection={section.table.rowSelection}
        expandable={section.table.expandable}
        showHeader={section.table.showHeader ?? true}
        footer={section.table.footer}
        summary={section.table.summary}
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
      columns: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string.isRequired,
        dataIndex: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.arrayOf(PropTypes.string)
        ]).isRequired,
        key: PropTypes.string.isRequired,
        width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        fixed: PropTypes.oneOf(['left', 'right']),
        sorter: PropTypes.bool,
        filters: PropTypes.arrayOf(PropTypes.shape({
          text: PropTypes.string,
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        })),
        filterMode: PropTypes.string,
        filterSearch: PropTypes.bool,
        render: PropTypes.shape({
          type: PropTypes.oneOf(['tag', 'text', 'actions']),
          colorMap: PropTypes.object,
          template: PropTypes.string,
          fallback: PropTypes.string,
          items: PropTypes.arrayOf(PropTypes.shape({
            tooltip: PropTypes.string,
            buttonProps: PropTypes.shape({
              type: PropTypes.string,
              icon: PropTypes.string,
              danger: PropTypes.bool,
              disabled: PropTypes.bool,
              label: PropTypes.string
            }),
            onClick: PropTypes.shape({
              type: PropTypes.string,
              modalId: PropTypes.string
            })
          }))
        })
      })).isRequired,
      rowKey: PropTypes.string,
      bordered: PropTypes.bool,
      size: PropTypes.oneOf(['small', 'middle', 'large']),
      pagination: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.shape({
          pageSize: PropTypes.number,
          showSizeChanger: PropTypes.bool,
          showQuickJumper: PropTypes.bool,
          position: PropTypes.arrayOf(PropTypes.oneOf([
            'topLeft', 'topCenter', 'topRight',
            'bottomLeft', 'bottomCenter', 'bottomRight'
          ]))
        })
      ]),
      scroll: PropTypes.shape({
        x: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.bool]),
        y: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      }),
      showHeader: PropTypes.bool,
      footer: PropTypes.func,
      summary: PropTypes.func,
      rowSelection: PropTypes.object,
      expandable: PropTypes.object,
      searchConfig: PropTypes.shape({
        placeholder: PropTypes.string,
        fields: PropTypes.arrayOf(PropTypes.string)
      })
    }).isRequired,
    actions: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string,
      buttonProps: PropTypes.shape({
        type: PropTypes.string,
        icon: PropTypes.string,
        disabled: PropTypes.bool
      }),
      onClick: PropTypes.shape({
        type: PropTypes.string,
        modalId: PropTypes.string
      })
    }))
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
    total: PropTypes.number,
    showSizeChanger: PropTypes.bool,
    showQuickJumper: PropTypes.bool
  })
};

TableComponent.defaultProps = {
  loading: false,
  data: [],
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true
  }
};

export default TableComponent;