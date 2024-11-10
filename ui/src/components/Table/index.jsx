import React from 'react';
import { Table, Space, Button, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

const TableComponent = ({
  config,
  loading,
  tableData,
  onModalOpen
}) => {
  const formSection = config.sections.find(section => section.type === 'form');

  const getIcon = (iconName) => {
    const icons = {
      PlusOutlined: <PlusOutlined />,
      EditOutlined: <EditOutlined />,
      DeleteOutlined: <DeleteOutlined />
    };
    return icons[iconName];
  };

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
                      key={index}
                      {...action.buttonProps}
                      icon={getIcon(action.buttonProps.icon)}
                      onClick={() => {
                        if (action.onClick?.type === 'modal') {
                          onModalOpen(action.onClick.modalId, record);
                        }
                      }}
                      style={{ padding: 0, margin: 0 }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Space>
              )
            };

          case 'tag':
            return {
              ...column,
              render: (text) => {
                const color = renderConfig.colorMap[text] || 'default';
                return <Tag color={color}>{text}</Tag>;
              }
            };

          case 'date':
            return {
              ...column,
              render: (text) => text ? new Date(text).toLocaleDateString() : '-'
            };

          default:
            return column;
        }
      }
      return column;
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
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              margin: 0
            }}>
              {formSection.title}
            </h2>
            <p style={{ 
              color: '#6B7280', 
              margin: '4px 0 0 0',
              fontSize: '14px'
            }}>
              {formSection.subtitle}
            </p>
          </div>

          <div>
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
          </div>
        </div>

        <Table
          columns={processTableColumns(formSection.table.columns)}
          dataSource={tableData}
          loading={loading}
          rowKey={formSection.table.rowKey || 'id'}
          pagination={formSection.table.pagination || {
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} items`,
            showQuickJumper: true,
            position: ['bottomRight']
          }}
          size={formSection.table.size || 'middle'}
          scroll={{ x: true }}
          bordered={formSection.table.bordered}
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
        rowKey: PropTypes.string,
        pagination: PropTypes.object,
        size: PropTypes.string,
        bordered: PropTypes.bool
      }),
      actions: PropTypes.arrayOf(PropTypes.object)
    })).isRequired
  }).isRequired,
  loading: PropTypes.bool.isRequired,
  tableData: PropTypes.array.isRequired,
  onModalOpen: PropTypes.func.isRequired
};

export default TableComponent;