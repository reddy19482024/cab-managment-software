// frontend/src/components/forms/FormBuilder.jsx
import React from 'react';
import { Form, Input, Select, DatePicker, Switch, Radio, Checkbox } from 'antd';
import { useForm } from 'antd/es/form/Form';
import ComponentBuilder from '@/builders/ComponentBuilder';

export const FormBuilder = ({ 
  config, 
  onSubmit, 
  onValuesChange,
  initialValues = {}
}) => {
  const [form] = useForm();
  const { 
    layout = 'vertical',
    fields = [],
    sections = [],
    buttons = []
  } = config;

  const buildField = (fieldConfig) => {
    const { type, name, label, rules = [], ...restConfig } = fieldConfig;

    const getFieldComponent = () => {
      switch (type) {
        case 'text':
        case 'email':
        case 'password':
          return (
            <Input 
              type={type} 
              {...restConfig}
            />
          );

        case 'select':
          return (
            <Select
              {...restConfig}
              options={restConfig.options}
              mode={restConfig.multiple ? 'multiple' : undefined}
            />
          );

        case 'date':
          return (
            <DatePicker 
              {...restConfig}
            />
          );

        case 'switch':
          return (
            <Switch 
              {...restConfig}
            />
          );

        case 'radio':
          return (
            <Radio.Group 
              {...restConfig}
              options={restConfig.options}
            />
          );

        case 'checkbox':
          return (
            <Checkbox.Group 
              {...restConfig}
              options={restConfig.options}
            />
          );

        case 'custom':
          return (
            <ComponentBuilder
              type={restConfig.component}
              config={restConfig.config}
            />
          );

        default:
          return <Input {...restConfig} />;
      }
    };

    return (
      <Form.Item
        key={name}
        name={name}
        label={label}
        rules={rules}
        valuePropName={type === 'switch' ? 'checked' : 'value'}
        {...restConfig.formItemProps}
      >
        {getFieldComponent()}
      </Form.Item>
    );
  };

  const buildSection = (section) => {
    const { title, description, fields: sectionFields = [] } = section;

    return (
      <div key={title} className="mb-8">
        {title && (
          <div className="mb-4">
            <h3 className="text-lg font-medium">{title}</h3>
            {description && (
              <p className="text-gray-500">{description}</p>
            )}
          </div>
        )}
        {sectionFields.map(buildField)}
      </div>
    );
  };

  const handleSubmit = async (values) => {
    try {
      await onSubmit?.(values);
    } catch (error) {
      // Handle error
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form
      form={form}
      layout={layout}
      initialValues={initialValues}
      onFinish={handleSubmit}
      onValuesChange={onValuesChange}
      className="w-full"
    >
      {sections.length > 0 ? (
        sections.map(buildSection)
      ) : (
        fields.map(buildField)
      )}

      {buttons.length > 0 && (
        <Form.Item>
          <div className="flex justify-end gap-2">
            {buttons.map((button, index) => (
              <ComponentBuilder
                key={index}
                type="button"
                config={button}
              />
            ))}
          </div>
        </Form.Item>
      )}
    </Form>
  );
};