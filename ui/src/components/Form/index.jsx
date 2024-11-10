import React from 'react';
import { Form, Input, Button, Select, Checkbox } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

const FormComponent = ({
  config,
  form,
  loading,
  onModalOpen,
  onFormSubmit
}) => {
  const formSection = config.sections.find(section => section.type === 'form');

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

  return (
    <div style={formSection.containerStyle}>
      <div style={formSection.wrapperStyle}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: formSection.title?.fontSize || '24px', 
            fontWeight: formSection.title?.fontWeight || '600',
            margin: formSection.title?.margin || 0
          }}>
            {formSection.title}
          </h2>
          {formSection.subtitle && (
            <p style={{ 
              color: formSection.subtitle?.color || '#6B7280',
              margin: formSection.subtitle?.margin || '4px 0 0 0',
              fontSize: formSection.subtitle?.fontSize || '14px'
            }}>
              {formSection.subtitle}
            </p>
          )}
        </div>

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

          {formSection.divider && (
            <div style={formSection.divider.style}>
              <div className={`ant-divider ant-divider-horizontal ant-divider-with-text ant-divider-with-text-${formSection.divider.orientation || 'center'}`}>
                <span className="ant-divider-inner-text">
                  {formSection.divider.text}
                </span>
              </div>
            </div>
          )}

          {formSection.socialButtons?.map((button, index) => (
            <Button
              key={index}
              {...button.buttonProps}
              style={button.style}
            >
              {button.label}
            </Button>
          ))}

          {formSection.links?.map((link, index) => (
            <a 
              key={index} 
              href={link.url}
              style={link.style}
            >
              {link.text}
            </a>
          ))}

          <Form.Item>
            {formSection.actions?.map((action, index) => (
              (action.type === 'submit' || !action.onClick) && (
                <Button
                  key={index}
                  {...action.buttonProps}
                  loading={loading}
                  htmlType="submit"
                  style={action.style}
                >
                  {action.label}
                </Button>
              )
            ))}
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

FormComponent.propTypes = {
  config: PropTypes.shape({
    sections: PropTypes.arrayOf(PropTypes.object).isRequired
  }).isRequired,
  form: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  onModalOpen: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired
};

export default FormComponent;