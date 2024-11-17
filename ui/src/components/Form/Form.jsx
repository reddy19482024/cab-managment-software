import React, { useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, TimePicker, InputNumber, Divider } from 'antd';
import * as AntdIcons from '@ant-design/icons';
import PropTypes from 'prop-types';
import moment from 'moment';
import useApi from '../../hooks/useApi';

const FormComponent = ({
  config,
  form,
  loading,
  onFormSubmit,
  initialValues = {}
}) => {
  const { apiRequest } = useApi();
  const formSection = config?.sections?.find(section => section.type === 'form');

  useEffect(() => {
    if (!formSection?.fields) return;

    form.resetFields();

    if (initialValues && Object.keys(initialValues).length > 0) {
      const formattedValues = formatInitialValues(initialValues);
      form.setFieldsValue(formattedValues);
    }
    
    loadSelectFieldOptions();
  }, [config, initialValues]);

  const formatInitialValues = (values) => {
    if (!values || !formSection?.fields) return {};

    return Object.entries(values).reduce((acc, [key, value]) => {
      if (!value) return acc;

      const field = formSection.fields.find(f => f.name === key);
      if (field) {
        if (field.type === 'select') {
          // Handle select fields with labelInValue
          acc[key] = {
            value: value,
            label: value // This will be updated once options are loaded
          };
        } else if (['date', 'datetime'].includes(field.type)) {
          acc[key] = value ? moment(value) : null;
        } else {
          acc[key] = value;
        }
      }
      return acc;
    }, {});
  };

  const loadSelectFieldOptions = async () => {
    if (!formSection?.fields) return;

    const selectFields = formSection.fields.filter(field => 
      field.type === 'select' && field.api
    );

    for (const field of selectFields) {
      try {
        if (!field.api?.endpoint) continue;

        let endpoint = field.api.endpoint;
        
        if (field.api.params) {
          const processedParams = {};
          Object.entries(field.api.params).forEach(([key, value]) => {
            if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
              const formValue = form.getFieldValue(value.slice(1, -1));
              if (formValue) {
                processedParams[key] = formValue?.value || formValue;
              }
            } else {
              processedParams[key] = value;
            }
          });

          if (field.api.method === 'GET' && Object.keys(processedParams).length > 0) {
            const queryString = new URLSearchParams(processedParams).toString();
            endpoint = `${endpoint}${queryString ? '?' + queryString : ''}`;
          }
        }

        const response = await apiRequest(
          endpoint,
          field.api.method || 'GET',
          field.api.method === 'GET' ? undefined : field.api.params
        );

        if (response?.data) {
          const { label: labelKey = 'label', value: valueKey = '_id', customLabel } = field.fieldNames || {};

          const options = response.data.map(item => ({
            label: customLabel 
              ? customLabel.replace(/\${(\w+)}/g, (_, key) => {
                  const keys = key.split('.');
                  let value = item;
                  for (const k of keys) {
                    value = value?.[k];
                  }
                  return value || '';
                })
              : item[labelKey],
            value: item[valueKey],
          }));

          field.options = options;

          // Update the current form value with the matching option if it exists
          const currentValue = form.getFieldValue(field.name);
          if (currentValue) {
            const valueToMatch = typeof currentValue === 'object' ? currentValue.value : currentValue;
            const matchingOption = options.find(opt => opt.value === valueToMatch);
            if (matchingOption) {
              form.setFieldsValue({
                [field.name]: {
                  label: matchingOption.label,
                  value: matchingOption.value,
                },
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error loading options for ${field.name}:`, error);
        field.options = [];
      }
    }
  };

  const getIcon = (iconName) => {
    if (!iconName) return null;
    const Icon = AntdIcons[iconName];
    return Icon ? <Icon /> : null;
  };

  const renderFormField = (field) => {
    switch (field.type) {
      case 'password':
        return (
          <Input.Password
            {...field.inputProps}
            size={field.size}
            placeholder={field.placeholder}
            prefix={field.prefix && getIcon(field.prefix)}
            allowClear={field.allowClear}
          />
        );

      case 'select':
        return (
          <Select
            {...field.dropdownProps}
            options={field.options}
            mode={field.mode}
            size={field.size}
            placeholder={field.placeholder}
            allowClear={field.allowClear}
            labelInValue
            showSearch={field.dropdownProps?.showSearch}
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: '100%' }}
          />
        );

      case 'datetime':
        return (
          <DatePicker
            showTime={{
              format: 'HH:mm:ss',
              defaultValue: moment('00:00:00', 'HH:mm:ss')
            }}
            size={field.size}
            placeholder={field.placeholder}
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: '100%' }}
          />
        );

      case 'date':
        return (
          <DatePicker
            size={field.size}
            placeholder={field.placeholder}
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
          />
        );

      case 'time':
        return (
          <TimePicker
            size={field.size}
            placeholder={field.placeholder}
            format="HH:mm:ss"
            style={{ width: '100%' }}
          />
        );

      case 'number':
        return (
          <InputNumber
            {...field.inputProps}
            size={field.size}
            placeholder={field.placeholder}
            style={{ width: '100%' }}
          />
        );

      default:
        return (
          <Input
            {...field.inputProps}
            size={field.size}
            placeholder={field.placeholder}
            prefix={field.prefix && getIcon(field.prefix)}
            allowClear
          />
        );
    }
  };

  const handleFinish = (values) => {
    if (!values || !formSection?.fields) return;

    const formattedValues = Object.entries(values).reduce((acc, [key, value]) => {
      if (value === undefined || value === null) return acc;

      const field = formSection.fields.find(f => f.name === key);
      if (field) {
        if (field.type === 'select') {
          // For select fields, just take the value part
          acc[key] = value?.value !== undefined ? value.value : value;
        } else if (['date', 'datetime'].includes(field.type)) {
          // Convert moment object to ISO string
          acc[key] = value ? value.toISOString() : null;
        } else {
          acc[key] = value;
        }
      }
      return acc;
    }, {});

    onFormSubmit(formattedValues);
  };

  if (!formSection) return null;

  return (
    <div style={formSection.containerStyle}>
      <div style={formSection.wrapperStyle}>
        {formSection.title && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '24px',
              fontWeight: '600',
              margin: 0,
              textAlign: 'center'
            }}>
              {formSection.title}
            </h2>
            {formSection.subtitle && (
              <p style={{ 
                color: '#6B7280',
                margin: '4px 0 0 0',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {formSection.subtitle}
              </p>
            )}
          </div>
        )}

        <Form
          form={form}
          layout={formSection.layout?.type}
          labelCol={formSection.layout?.labelCol}
          wrapperCol={formSection.layout?.wrapperCol}
          onFinish={handleFinish}
        >
          {formSection.fields?.map((field) => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              rules={field.rules}
              dependencies={field.dependencies}
              tooltip={field.tooltip}
              getValueProps={
                ['date', 'datetime'].includes(field.type) 
                  ? (value) => ({ 
                      value: value ? moment(value) : "",
                    })
                  : undefined
              }
            >
              {renderFormField(field)}
            </Form.Item>
          ))}

          {formSection.actions?.map((action, index) => (
            <Form.Item key={index} style={action.style}>
              <Button
                {...action.buttonProps}
                loading={loading && action.buttonProps?.htmlType === 'submit'}
                icon={action.buttonProps?.icon && getIcon(action.buttonProps.icon)}
                onClick={() => {
                  if (action.onClick?.type === 'modal') {
                    // Handle modal action
                  } else if (action.buttonProps?.htmlType === 'submit') {
                    form.submit();
                  }
                }}
              >
                {action.label}
              </Button>
            </Form.Item>
          ))}

          {formSection.divider && (
            <Divider {...formSection.divider}>
              {formSection.divider.text}
            </Divider>
          )}

          {formSection.socialButtonGroup && (
            <div style={formSection.socialButtonGroup.style}>
              {formSection.socialButtonGroup.buttons.map((button, index) => (
                <Button
                  key={index}
                  {...button.buttonProps}
                  style={button.style}
                  icon={button.buttonProps?.icon && getIcon(button.buttonProps.icon)}
                  aria-label={button.ariaLabel}
                />
              ))}
            </div>
          )}

          {formSection.links?.map((link, index) => (
            <a 
              key={index} 
              href={link.url}
              style={link.style}
            >
              {link.text}
            </a>
          ))}
        </Form>
      </div>
    </div>
  );
};

FormComponent.propTypes = {
  config: PropTypes.shape({
    sections: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string.isRequired,
        fields: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
            type: PropTypes.string.isRequired,
            label: PropTypes.string,
            rules: PropTypes.array,
            api: PropTypes.shape({
              endpoint: PropTypes.string,
              method: PropTypes.string,
              params: PropTypes.object
            }),
            fieldNames: PropTypes.shape({
              label: PropTypes.string,
              value: PropTypes.string,
              customLabel: PropTypes.string
            }),
          })
        ),
        actions: PropTypes.array,
        divider: PropTypes.object,
        links: PropTypes.array,
        socialButtonGroup: PropTypes.object,
      })
    ).isRequired,
  }).isRequired,
  form: PropTypes.object.isRequired,
  loading: PropTypes.bool,
  onFormSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
};

FormComponent.defaultProps = {
  loading: false,
  initialValues: {},
};

export default FormComponent;