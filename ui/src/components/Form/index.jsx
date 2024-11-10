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
  const isAuthForm = formSection?.containerStyle?.padding?.includes('35%');

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
    <div style={{ flex: 1, padding: '24px' }}>
      <div style={{
        ...formSection.wrapperStyle,
        borderRadius: '8px',
        background: '#ffffff'
      }}>
        {!isAuthForm && (
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
                  onClick={() => onModalOpen(action.onClick.modalId)}
                >
                  {action.label}
                </Button>
              )
            ))}
          </div>
        )}

        {isAuthForm && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '24px', 
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
        )}

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
              <div className="ant-divider ant-divider-horizontal ant-divider-with-text ant-divider-with-text-center">
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
            <div key={index} style={link.style}>
              <a href={link.url}>{link.text}</a>
            </div>
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