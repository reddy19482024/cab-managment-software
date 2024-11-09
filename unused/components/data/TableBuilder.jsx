// frontend/src/components/data/TableBuilder.jsx
import React, { useState } from 'react';
import { Table, Button, Space, Tooltip } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import ComponentBuilder from '@/builders/ComponentBuilder';

export const TableBuilder = ({ 
  config,
  dataSource = [],
  loading = false,
  onTableChange,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const {
    columns = [],
    rowKey = 'id',
    pagination = true,
    rowSelection,
    filters = [],
    actions = [],
    scroll,
    size = 'middle'
  } = config;

  const buildColumnRender = (column) => {
    if (!column.render) return undefined;

    if (typeof column.render === 'string') {
      // Handle predefined renderers
      switch (column.render) {
        case 'date':
          return (value) => new Date(value).toLocaleDateString();
        case 'datetime':
          return (value) => new Date(value).toLocaleString();
        case 'boolean':
          return (value) => value ? 'Yes' : 'No';
        default:
          return undefined;
      }
    }

    if (typeof column.render === 'object') {
      // Handle component render
      return (value, record) => (
        <ComponentBuilder
          type={column.render.type}
          config={{
            ...column.render,
            props: {
              ...column.render.props,
              value,
              record
            }
          }}
        />
      );
    }

    return column.render;
  };

  const processColumns = () => {
    return columns.map(column => ({
      ...column,
      render: buildColumnRender(column),
      ...(column.sorter && {
        sorter: true,
        sortDirections: ['ascend', 'descend']
      }),
      ...(column.searchable && {
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
          <div className="p-2">
            <Input
              placeholder={`Search ${column.title}`}
              value={selectedKeys[0]}
              onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => confirm()}
              style={{ width: 188, marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                icon={<SearchOutlined />}
                size="small"
              >
                Search
              </Button>
              <Button onClick={() => clearFilters()} size="small">
                Reset
              </Button>
            </Space>
          </div>
        ),
        filterIcon: filtered => (
          <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        )
      })
    }));
  };

  const handleTableChange = (pagination, filters, sorter) => {
    onTableChange?.({
      pagination,
      filters,
      sorter: Array.isArray(sorter) ? sorter : [sorter]
    });
  };

  const handleRowSelection = (selectedKeys) => {
    setSelectedRowKeys(selectedKeys);
  };

  const renderFilters = () => {
    if (!filters.length) return null;

    return (
      <div className="mb-4">
        <Space wrap>
          {filters.map((filter, index) => (
            <ComponentBuilder
              key={index}
              type={filter.type}
              config={filter}
            />
          ))}
        </Space>
      </div>
    );
  };

  const renderActions = () => {
    if (!actions.length) return null;

    return (
      <div className="mb-4 flex justify-between">
        <Space>
          {actions.map((action, index) => (
            <ComponentBuilder
              key={index}
              type="button"
              config={action}
            />
          ))}
        </Space>
        {filters.length > 0 && (
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFiltersVisible(!filtersVisible)}
          >
            Filters
          </Button>
        )}
      </div>
    );
  };

  return (
    <div>
      {renderActions()}
      {filtersVisible && renderFilters()}
      
      <Table
        columns={processColumns()}
        dataSource={dataSource}
        rowKey={rowKey}
        pagination={pagination === true ? {
          showSizeChanger: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} items`
        } : pagination}
        rowSelection={rowSelection ? {
          selectedRowKeys,
          onChange: handleRowSelection,
          ...rowSelection
        } : undefined}
        onChange={handleTableChange}
        loading={loading}
        scroll={scroll}
        size={size}
      />
    </div>
  );
};

// Example usage in configuration:
const exampleFormConfig = {
  "components": {
    "userForm": {
      "type": "form",
      "config": {
        "layout": "vertical",
        "sections": [
          {
            "title": "Basic Information",
            "fields": [
              {
                "type": "text",
                "name": "name",
                "label": "Name",
                "rules": [{ "required": true }]
              },
              {
                "type": "email",
                "name": "email",
                "label": "Email",
                "rules": [
                  { "required": true },
                  { "type": "email" }
                ]
              }
            ]
          },
          {
            "title": "Additional Details",
            "fields": [
              {
                "type": "select",
                "name": "role",
                "label": "Role",
                "options": [
                  { "label": "Admin", "value": "admin" },
                  { "label": "User", "value": "user" }
                ]
              },
              {
                "type": "switch",
                "name": "active",
                "label": "Active Status"
              }
            ]
          }
        ],
        "buttons": [
          {
            "type": "button",
            "variant": "default",
            "text": "Cancel"
          },
          {
            "type": "button",
            "variant": "primary",
            "text": "Submit",
            "htmlType": "submit"
          }
        ]
      }
    }
  }
};

const exampleTableConfig = {
  "components": {
    "userTable": {
      "type": "table",
      "config": {
        "rowKey": "id",
        "columns": [
          {
            "title": "Name",
            "dataIndex": "name",
            "sorter": true,
            "searchable": true
          },
          {
            "title": "Email",
            "dataIndex": "email"
          },
          {
            "title": "Role",
            "dataIndex": "role"
          },
          {
            "title": "Status",
            "dataIndex": "status",
            "render": {
              "type": "tag",
              "config": {
                "colorMap": {
                  "active": "success",
                  "inactive": "error"
                }
              }
            }
          },
          {
            "title": "Actions",
            "render": {
              "type": "actionButtons",
              "config": {
                "items": [
                  {
                    "icon": "EditOutlined",
                    "tooltip": "Edit",
                    "onClick": "handleEdit"
                  },
                  {
                    "icon": "DeleteOutlined",
                    "tooltip": "Delete",
                    "onClick": "handleDelete"
                  }
                ]
              }
            }
          }
        ],
        "filters": [
          {
            "type": "select",
            "name": "role",
            "placeholder": "Filter by Role",
            "options": [
              { "label": "Admin", "value": "admin" },
              { "label": "User", "value": "user" }
            ]
          },
          {
            "type": "select",
            "name": "status",
            "placeholder": "Filter by Status",
            "options": [
              { "label": "Active", "value": "active" },
              { "label": "Inactive", "value": "inactive" }
            ]
          }
        ],
        "actions": [
          {
            "type": "button",
            "variant": "primary",
            "text": "Add User",
            "icon": "PlusOutlined",
            "onClick": "handleAdd"
          },
          {
            "type": "button",
            "variant": "default",
            "text": "Export",
            "icon": "DownloadOutlined",
            "onClick": "handleExport"
          }
        ]
      }
    }
  }
};