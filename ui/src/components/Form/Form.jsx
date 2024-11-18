import React, { useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, TimePicker, InputNumber, Divider, Checkbox, Radio, Space } from 'antd';
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
      
      await loadSelectFieldOptions();
      
      if (initialValues && Object.keys(initialValues).length > 0) {
        const formattedValues = await formatInitialValues(initialValues);
        form.setFieldsValue(formattedValues);
      }
    };

    initializeForm();
  }, [config, initialValues]);

  const formatInitialValues = async (values) => {
    if (!values || !formSection?.fields) return {};
  
    const formattedValues = {};
  
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || value === null) continue;
  
      const field = formSection.fields.find(f => f.name === key);
      if (!field) continue;
  
      switch (field.type) {
        case 'select':
          if (field.mode === 'multiple' && Array.isArray(value)) {
            const options = await ensureOptionsLoaded(field, value);
            formattedValues[key] = value;
          } else {
            const options = await ensureOptionsLoaded(field, [value]);
            formattedValues[key] = value;
          }
          break;
        
        case 'date':
        case 'datetime':
          formattedValues[key] = value ? moment(value) : null;
          break;
        
        case 'checkbox':
        case 'checkbox-group':
          formattedValues[key] = value;
          break;
        
        case 'radio':
        case 'radio-group':
          formattedValues[key] = value;
          break;
        
        default:
          formattedValues[key] = value;
      }
    }
  
    return formattedValues;
  };

  // ... (keep existing ensureOptionsLoaded and loadSelectFieldOptions functions)
  const ensureOptionsLoaded = async (field, values) => {
    if (!field.api?.endpoint || !values?.length) return [];

    // If options already exist and contain all values, use existing options
    if (field.options?.length) {
      const hasAllValues = values.every(value => 
        field.options.some(opt => opt.value === value)
      );
      if (hasAllValues) return field.options;
    }

    // Otherwise, fetch the options specifically for these values
    try {
      const queryParams = new URLSearchParams();
      if (field.api.params) {
        Object.entries(field.api.params).forEach(([key, value]) => {
          if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
            const formValue = form.getFieldValue(value.slice(1, -1));
            if (formValue) {
              queryParams.append(key, formValue?.value || formValue);
            }
          } else {
            queryParams.append(key, value);
          }
        });
      }
      // Add the values to fetch
      queryParams.append('ids', values.join(','));

      const endpoint = `${field.api.endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      console.log("endpoint",endpoint);
      
      const response = await apiRequest(endpoint, field.api.method || 'GET');

      if (response?.data) {
        const { label: labelKey = 'label', value: valueKey = '_id', customLabel } = field.fieldNames || {};

        const newOptions = response.data.map(item => {
          let label;
          if (customLabel) {
            label = customLabel.replace(/\${([^}]+)}/g, (_, path) => {
              return path.split('.').reduce((obj, key) => obj?.[key], item) || '';
            });
          } else {
            label = item[labelKey];
          }

          return {
            label,
            value: item[valueKey],
            record: item
          };
        });

        // Merge new options with existing options, avoiding duplicates
        field.options = field.options || [];
        newOptions.forEach(newOpt => {
          if (!field.options.some(opt => opt.value === newOpt.value)) {
            field.options.push(newOpt);
          }
        });

        return field.options;
      }
    } catch (error) {
      console.error(`Error loading options for ${field.name}:`, error);
    }

    return field.options || [];
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

          field.options = response.data.map(item => {
            let label;
            if (customLabel) {
              // Handle custom label template with complex object paths
              label = customLabel.replace(/\${([^}]+)}/g, (_, path) => {
                return path.split('.').reduce((obj, key) => obj?.[key], item) || '';
              });
            } else {
              label = item[labelKey];
            }

            return {
              label,
              value: item[valueKey],
              record: item
            };
          });
        }
      } catch (error) {
        console.error(`Error loading options for ${field.name}:`, error);
        field.options = [];
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

        case 'checkbox':
          return (
            <Checkbox
              {...field.checkboxProps}
              onChange={field.onChange}
            >
              {field.checkboxLabel || field.label}
            </Checkbox>
          );

      case 'checkbox-group':
        return (
          <Checkbox.Group
            {...field.checkboxGroupProps}
            options={field.options}
            style={{ width: '100%' }}
          >
            {field.children}
          </Checkbox.Group>
        );

      case 'radio':
        return (
          <Radio {...field.radioProps}>
            {field.radioLabel || field.label}
          </Radio>
        );

      case 'radio-group':
        return (
          <Radio.Group
            {...field.radioGroupProps}
            options={field.options}
            style={{ width: '100%' }}
          >
            {field.children}
          </Radio.Group>
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
        switch (field.type) {
          case 'select':
            if (field.mode === 'multiple') {
              acc[key] = value.map(v => v.value);
            } else {
              acc[key] = value.value;
            }
            break;
          
          case 'date':
          case 'datetime':
            acc[key] = value ? value.toISOString() : null;
            break;
          
          case 'checkbox':
          case 'checkbox-group':
          case 'radio':
          case 'radio-group':
            acc[key] = value;
            break;
          
          default:
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
          requiredMark={formSection.layout?.requiredMark}
        >
          {formSection.fields?.map((field) => (
            <Form.Item
            key={field.name}
            name={field.name}
            label={field.type === 'checkbox' ? null : field.label}  // Don't show label for checkboxes
            rules={field.rules}
            dependencies={field.dependencies}
            tooltip={field.tooltip}
            valuePropName={['checkbox', 'radio'].includes(field.type) ? 'checked' : 'value'}
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
            type: PropTypes.oneOf([
              'text',
              'password',
              'select',
              'date',
              'datetime',
              'time',
              'number',
              'checkbox',
              'checkbox-group',
              'radio',
              'radio-group'
            ]).isRequired,
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
            checkboxProps: PropTypes.object,
            checkboxGroupProps: PropTypes.object,
            radioProps: PropTypes.object,
            radioGroupProps: PropTypes.object,
            options: PropTypes.array,
          })
        ),
        actions: PropTypes.array,
        divider: PropTypes.object,
        links: PropTypes.array,
        socialButtonGroup: PropTypes.object,
        layout: PropTypes.shape({
          type: PropTypes.string,
          labelCol: PropTypes.object,
          wrapperCol: PropTypes.object,
          requiredMark: PropTypes.oneOf(['optional', true, false])
        })
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