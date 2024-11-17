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
    
    const initializeForm = async () => {
      form.resetFields();
      
      // Load initial values and their associated data
      if (initialValues && Object.keys(initialValues).length > 0) {
        await loadSelectFieldData();
        const formattedValues = await formatInitialValues(initialValues);
        form.setFieldsValue(formattedValues);
      }
      
      // Load all select field options
      await loadSelectFieldOptions();
    };

    initializeForm();
  }, [config, initialValues]);

  const loadSelectFieldData = async () => {
    if (!formSection?.fields || !initialValues) return;

    const selectFields = formSection.fields.filter(field => 
      field.type === 'select' && field.api
    );

    for (const field of selectFields) {
      try {
        const value = initialValues[field.name];
        if (!value) continue;

        let endpoint = field.api.endpoint;
        let params = { ...(field.api.params || {}) };

        if (field.mode === 'multiple' && Array.isArray(value)) {
          params = { ...params, ids: value.join(',') };
          endpoint = `${endpoint}${Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''}`;
        } else if (!field.mode && value) {
          endpoint = `${endpoint}/${value}`;
        } else {
          continue;
        }

        const response = await apiRequest(endpoint, 'GET');
        if (response?.data) {
          const { label: labelKey = 'label', value: valueKey = '_id', customLabel } = field.fieldNames || {};
          
          if (Array.isArray(response.data)) {
            field.initialOptions = response.data.map(item => ({
              label: getOptionLabel(item, customLabel, labelKey),
              value: item[valueKey],
              record: item
            }));
          } else {
            field.initialOptions = [{
              label: getOptionLabel(response.data, customLabel, labelKey),
              value: response.data[valueKey],
              record: response.data
            }];
          }
        }
      } catch (error) {
        console.error(`Error loading initial data for ${field.name}:`, error);
      }
    }
  };

  const loadSelectFieldOptions = async () => {
    if (!formSection?.fields) return;

    const selectFields = formSection.fields.filter(field => 
      field.type === 'select' && (field.api || field.options)
    );

    for (const field of selectFields) {
      try {
        // If field has predefined options, use them
        if (field.options) {
          continue;
        }

        if (!field.api?.endpoint) continue;

        // First, fetch the current value if it exists
        const currentValue = initialValues[field.name];
        let currentOption = null;

        if (currentValue && !field.mode) {
          try {
            const currentResponse = await apiRequest(`${field.api.endpoint}/${currentValue}`, 'GET');
            if (currentResponse?.data) {
              const { label: labelKey = 'label', value: valueKey = '_id', customLabel } = field.fieldNames || {};
              currentOption = {
                label: getOptionLabel(currentResponse.data, customLabel, labelKey),
                value: currentResponse.data[valueKey],
                record: currentResponse.data
              };
            }
          } catch (error) {
            console.error(`Error loading current value for ${field.name}:`, error);
          }
        }

        // Then fetch all available options
        let endpoint = field.api.endpoint;
        let params = { ...(field.api.params || {}) };
        
        // For multiple select, add current values to params
        if (field.mode === 'multiple' && Array.isArray(currentValue) && currentValue.length > 0) {
          params = { ...params, ids: currentValue.join(',') };
        }
        
        if (Object.keys(params).length) {
          endpoint = `${endpoint}?${new URLSearchParams(params).toString()}`;
        }

        const response = await apiRequest(endpoint, field.api.method || 'GET');

        if (response?.data) {
          const { label: labelKey = 'label', value: valueKey = '_id', customLabel } = field.fieldNames || {};

          let options = Array.isArray(response.data) ? response.data : [response.data];
          options = options.map(item => ({
            label: getOptionLabel(item, customLabel, labelKey),
            value: item[valueKey],
            record: item
          }));

          // Add current option if it's not in the list
          if (currentOption && !options.some(opt => opt.value === currentOption.value)) {
            options.unshift(currentOption);
          }

          // Remove duplicates
          field.options = options.filter((opt, index, self) =>
            index === self.findIndex((t) => t.value === opt.value)
          );
        }
      } catch (error) {
        console.error(`Error loading options for ${field.name}:`, error);
        field.options = field.initialOptions || [];
      }
    }
  };

  const getOptionLabel = (item, customLabel, labelKey) => {
    if (customLabel) {
      return customLabel.replace(/\${([^}]+)}/g, (_, path) => {
        return path.split('.').reduce((obj, key) => obj?.[key], item) || '';
      });
    }
    return item[labelKey];
  };

  // ... rest of the component remains the same ...
  
  // Only the formatInitialValues function needs to be updated to use the new options:
  const formatInitialValues = async (values) => {
    if (!values || !formSection?.fields) return {};

    const formattedValues = {};

    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || value === null) continue;

      const field = formSection.fields.find(f => f.name === key);
      if (!field) continue;

      if (field.type === 'select') {
        if (field.mode === 'multiple' && Array.isArray(value)) {
          formattedValues[key] = field.options
            ?.filter(opt => value.includes(opt.value))
            .map(opt => ({
              label: opt.label,
              value: opt.value
            })) || value;
        } else {
          const option = field.options?.find(opt => opt.value === value);
          formattedValues[key] = option 
            ? { label: option.label, value: option.value }
            : value;
        }
      } else if (['date', 'datetime'].includes(field.type)) {
        formattedValues[key] = value ? moment(value) : null;
      } else {
        formattedValues[key] = value;
      }
    }

    return formattedValues;
  };

  // Rest of the component (getIcon, renderFormField, handleFinish) remains the same...
  // Only changes are to the initialization and data loading logic above

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
          if (field.mode === 'multiple') {
            acc[key] = value.map(v => v.value);
          } else {
            acc[key] = value.value;
          }
        } else if (['date', 'datetime'].includes(field.type)) {
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