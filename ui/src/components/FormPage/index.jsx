// components/FormPage/index.js
import React from 'react';
import { Form, Input, Button, Table, Space, Select, Checkbox } from 'antd';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  LockOutlined
} from '@ant-design/icons';
import PropTypes from 'prop-types';

const FormPageComponent = ({
  config,
  form,
  loading,
  tableData,
  onModalOpen,
  onFormSubmit
}) => {
  const renderFormField = (field) => {
    switch (field.type) {
      case 'password':
        return (
          <Input.Password
            prefix={<LockOutlined />}
            size={field.size}
            placeholder={field.placeholder}
          />
        );
      case 'email':
        return (
          <Input
            prefix={<MailOutlined />}
            size={field.size}
            placeholder={field.placeholder}
          />
        );
      case 'select':
        return (
          <Select
            size={field.size}
            placeholder={field.placeholder}
            options={field.options}
            allowClear
          />
        );
      case 'checkbox':
        return (
          <Checkbox>{field.label}</Checkbox>
        );
      default:
        return (
          <Input
            size={field.size}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const renderPageContent = () => {
    const formSection = config.sections.find(section => section.type === 'form');
    const bannerSection = config.sections.find(section => section.type === 'banner');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Banner Section */}
        {bannerSection && (
          <div style={{
            ...bannerSection.style,
            padding: '16px 24px',
            marginBottom: 0
          }}>
            <div style={{
              ...bannerSection.content.style,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%'
            }}>
              {bannerSection.content.image && (
                <img 
                  src={bannerSection.content.image} 
                  alt="Banner" 
                  style={{ height: '32px', marginBottom: '12px' }}
                />
              )}
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#ffffff', 
                margin: 0
              }}>
                {bannerSection.content.title}
              </h1>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '4px 0 0 0'
              }}>
                {bannerSection.content.description}
              </p>
            </div>
          </div>
        )}

        {/* Form/Table Section */}
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

              {formSection.actions?.map(action => (
                action.onClick?.type === 'modal' && (
                  <Button
                    key={action.label}
                    {...action.buttonProps}
                    icon={<PlusOutlined />}
                    onClick={() => onModalOpen(action.onClick.modalId)}
                  >
                    {action.label}
                  </Button>
                )
              ))}
            </div>

            {formSection.table?.enabled ? (
              <Table
                columns={formSection.table.columns.map(column => ({
                  ...column,
                  render: column.render?.type === 'actions' 
                    ? (_, record) => (
                        <Space size="middle">
                          <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => onModalOpen('editEmployeeModal', record)}
                            style={{ padding: 0, margin: 0 }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => onModalOpen('deleteEmployeeModal', record)}
                            style={{ padding: 0, margin: 0 }}
                          >
                            Delete
                          </Button>
                        </Space>
                      )
                    : column.render
                }))}
                dataSource={tableData}
                loading={loading}
                rowKey="id"
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
                bordered
              />
            ) : (
              <Form
                form={form}
                layout={formSection.layout?.type}
                labelCol={formSection.layout?.labelCol}
                wrapperCol={formSection.layout?.wrapperCol}
                onFinish={onFormSubmit}
              >
                {formSection.fields?.map((field) => (
                  <Form.Item
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    rules={field.rules}
                  >
                    {renderFormField(field)}
                  </Form.Item>
                ))}

                {formSection.links?.map((link, index) => (
                  <div key={index} style={link.style}>
                    <a href={link.url}>{link.text}</a>
                  </div>
                ))}

                <Form.Item>
                  <Button
                    {...formSection.actions[0].buttonProps}
                    loading={loading}
                    htmlType="submit"
                    style={formSection.actions[0].style}
                  >
                    {formSection.actions[0].label}
                  </Button>
                </Form.Item>
              </Form>
            )}
          </div>
        </div>
      </div>
    );
  };

  return renderPageContent();
};

FormPageComponent.propTypes = {
  config: PropTypes.shape({
    layout: PropTypes.object.isRequired,
    sections: PropTypes.arrayOf(PropTypes.object).isRequired
  }).isRequired,
  form: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  tableData: PropTypes.array.isRequired,
  onModalOpen: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired
};

export default FormPageComponent;