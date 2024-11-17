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
        if (['date', 'datetime'].includes(field.type)) {
          const momentDate = moment(value);
          acc[key] = momentDate.isValid() ? momentDate : null;
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
                processedParams[key] = formValue;
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

          field.options = response.data.map(item => ({
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
      case 'select':
        return (
          <Select
            {...field.dropdownProps}
            options={field.options}
            mode={field.mode}
            size={field.size}
            placeholder={field.placeholder}
            allowClear={field.allowClear}
            style={{ width: '100%' }}
          />
        );

      case 'datetime':
        return (
          <DatePicker
            showTime
            size={field.size}
            placeholder={field.placeholder}
            format="YYYY-MM-DD HH:mm:ss"
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
        if (['date', 'datetime'].includes(field.type) && moment.isMoment(value)) {
          acc[key] = value.isValid() ? value.toISOString() : null;
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
            <h2 style={formSection.title.style}>{formSection.title.text}</h2>
            {formSection.subtitle && (
              <p style={formSection.subtitle.style}>{formSection.subtitle.text}</p>
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
            >
              {renderFormField(field)}
            </Form.Item>
          ))}

          {formSection.actions?.map((action, index) => (
            <Form.Item key={index}>
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
          })
        ),
        actions: PropTypes.array,
        divider: PropTypes.object,
        links: PropTypes.array,
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