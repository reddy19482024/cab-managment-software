import React, { useState, useCallback } from 'react';
import { Table, Space, Button, Tag, Input, Select } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

const { Option } = Select;

const TableComponent = ({
  config,
  loading,
  tableData,
  onModalOpen,
  onSearch,
  onFilter
}) => {
  const formSection = config.sections.find(section => section.type === 'form');
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({});

  const getIcon = (iconName) => {
    const icons = {
      PlusOutlined: <PlusOutlined />,
      EditOutlined: <EditOutlined />,
      DeleteOutlined: <DeleteOutlined />,
      SearchOutlined: <SearchOutlined />
    };
    return icons[iconName];
  };

  const handleSearch = useCallback((value) => {
    setSearchText(value);
    if (onSearch) {
      const searchConfig = formSection.table.searchConfig;
      onSearch(value, searchConfig.fields);
    }
  }, [formSection.table.searchConfig, onSearch]);

  const handleFilter = useCallback((name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    if (onFilter) {
      onFilter(newFilters);
    }
  }, [filters, onFilter]);

  const processTableColumns = (columns) => {
    return columns.map(column => {
      if (column.render) {
        const renderConfig = column.render;
        
        switch (renderConfig.type) {
          case 'actions':
            return {
              ...column,
              render: (_, record) => (
                <Space size="middle">
                  {renderConfig.items.map((action, index) => (
                    <Button
                      key={`${record._id || record.id}-${index}`}
                      {...action.buttonProps}
                      icon={getIcon(action.buttonProps.icon)}
                      onClick={() => {
                        if (action.onClick?.type === 'modal') {
                          const transformedData = {};
                          if (action.onClick.dataTransform) {
                            Object.entries(action.onClick.dataTransform).forEach(([key, path]) => {
                              transformedData[key] = path.split('.').reduce((obj, key) => obj?.[key], record);
                            });
                          }
                          onModalOpen(action.onClick.modalId, { ...record, ...transformedData });
                        }
                      }}
                      style={{ padding: 0, margin: 0 }}
                    />
                  ))}
                </Space>
              )
            };

          case 'tag':
            return {
              ...column,
              render: (text) => {
                const color = renderConfig.colorMap[text] || 'default';
                return <Tag color={color}>{text?.toUpperCase()}</Tag>;
              }
            };

          case 'text':
            return {
              ...column,
              render: (text, record) => {
                if (!text && renderConfig.fallback) {
                  return renderConfig.fallback;
                }
                if (renderConfig.template) {
                  let result = renderConfig.template;
                  const data = column.dataIndex.reduce((obj, key) => obj?.[key], record);
                  Object.keys(data || {}).forEach(key => {
                    result = result.replace(`\${${key}}`, data[key]);
                  });
                  return result;
                }
                return text;
              }
            };

          default:
            return column;
        }
      }
      return {
        ...column,
        dataIndex: Array.isArray(column.dataIndex) ? column.dataIndex : [column.dataIndex],
        render: Array.isArray(column.dataIndex) 
          ? (_, record) => column.dataIndex.reduce((obj, key) => obj?.[key], record)
          : undefined
      };
    });
  };

  return (
    <div style={{ flex: 1, padding: '24px' }}>
      <div style={{
        ...formSection.wrapperStyle,
        borderRadius: '8px',
        background: '#ffffff'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
              {formSection.title}
            </h2>
            <p style={{ color: '#6B7280', margin: '4px 0 0 0', fontSize: '14px' }}>
              {formSection.subtitle}
            </p>
          </div>

          <Space>
            {formSection.table.searchConfig && (
              <Input.Search
                placeholder={formSection.table.searchConfig.placeholder}
                onSearch={handleSearch}
                style={{ width: 300 }}
                allowClear
              />
            )}
            
            {formSection.table.filterConfig?.filters.map(filter => (
              <Select
                key={filter.name}
                placeholder={filter.label}
                style={{ width: 150 }}
                onChange={(value) => handleFilter(filter.name, value)}
                allowClear
              >
                {filter.options?.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            ))}

            {formSection.actions?.map((action, index) => (
              action.onClick?.type === 'modal' && (
                <Button
                  key={index}
                  {...action.buttonProps}
                  icon={getIcon(action.buttonProps.icon)}
                  onClick={() => onModalOpen(action.onClick.modalId)}
                  style={action.style}
                >
                  {action.label}
                </Button>
              )
            ))}
          </Space>
        </div>

        <Table
          columns={processTableColumns(formSection.table.columns)}
          dataSource={tableData}
          loading={loading}
          rowKey={(record) => record._id || record.id}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} items`,
            showQuickJumper: true,
            position: ['bottomRight']
          }}
          size="middle"
          scroll={{ x: true }}
        />
      </div>
    </div>
  );
};

TableComponent.propTypes = {
  config: PropTypes.shape({
    sections: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string,
      title: PropTypes.string,
      subtitle: PropTypes.string,
      wrapperStyle: PropTypes.object,
      table: PropTypes.shape({
        columns: PropTypes.arrayOf(PropTypes.object).isRequired,
        searchConfig: PropTypes.shape({
          placeholder: PropTypes.string,
          fields: PropTypes.arrayOf(PropTypes.string)
        }),
        filterConfig: PropTypes.shape({
          filters: PropTypes.arrayOf(PropTypes.shape({
            label: PropTypes.string,
            name: PropTypes.string,
            type: PropTypes.string,
            options: PropTypes.arrayOf(PropTypes.shape({
              label: PropTypes.string,
              value: PropTypes.string
            }))
          }))
        })
      }),
      actions: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        buttonProps: PropTypes.object,
        style: PropTypes.object,
        onClick: PropTypes.shape({
          type: PropTypes.string,
          modalId: PropTypes.string
        })
      }))
    })).isRequired
  }).isRequired,
  loading: PropTypes.bool.isRequired,
  tableData: PropTypes.array.isRequired,
  onModalOpen: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  onFilter: PropTypes.func
};

export default TableComponent;