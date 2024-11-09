// src/components/base/Form/index.jsx
import React from 'react';
import { Form, Input, Select, DatePicker, Button } from 'antd';
import { useApi } from '../../../hooks/useApi';

const BaseForm = ({ config }) => {
  const [form] = Form.useForm();
  const api = useApi();

  const handleSubmit = async (values) => {
    if (!config.api) return;

    try {
      await api.post(config.api.url, values);
      
      if (config.onSuccess) {
        config.onSuccess(values);
      }
      
      if (config.resetOnSubmit) {
        form.resetFields();
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'input':
        return <Input {...field.props} />;
        
      case 'select':
        return (
          <Select {...field.props}>
            {field.options?.map(option => (
              <Select.Option 
                key={option.value} 
                value={option.value}
              >
                {option.label}
              </Select.Option>
            ))}
          </Select>
        );

      case 'datepicker':
        return <DatePicker {...field.props} />;

      default:
        return <Input {...field.props} />;
    }
  };

  return (
    <Form
      form={form}
      {...config.props}
      onFinish={handleSubmit}
    >
      {config.fields?.map(field => (
        <Form.Item
          key={field.name}
          name={field.name}
          label={field.label}
          rules={field.rules}
        >
          {renderField(field)}
        </Form.Item>
      ))}
      
      {config.submitButton && (
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            {...config.submitButton}
          >
            {config.submitButton.text || 'Submit'}
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

export default BaseForm;