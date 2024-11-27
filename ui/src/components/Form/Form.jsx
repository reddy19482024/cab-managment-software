import React, { useEffect } from 'react';
import { Form, Button, Divider } from 'antd';
import * as AntdIcons from '@ant-design/icons';
import PropTypes from 'prop-types';
import moment from 'moment';
import useApi from '../../hooks/useApi';
import FormFieldRenderer from './FormFieldRenderer';

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

  const ensureOptionsLoaded = async (field, values) => {
    if (!field.api?.endpoint || !values?.length) return [];

    if (field.options?.length) {
      const hasAllValues = values.every(value => 
        field.options.some(opt => opt.value === value)
      );
      if (hasAllValues) return field.options;
    }

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
      queryParams.append('ids', values.join(','));

      const endpoint = `${field.api.endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiRequest(endpoint, field.api.method || 'GET');

      if (response?.data) {
        const { label: labelKey = 'label', value: valueKey = '_id', customLabel } = field.fieldNames || {};

        const newOptions = response.data.map(item => ({
          label: getOptionLabel(item, customLabel, labelKey),
          value: item[valueKey],
          record: item
        }));

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
        if (field.options) continue;
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
          field.options = response.data.map(item => ({
            label: getOptionLabel(item, customLabel, labelKey),
            value: item[valueKey],
            record: item
          }));
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
            <FormFieldRenderer key={field.name} field={field} />
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
        title: PropTypes.string,
        subtitle: PropTypes.string,
        containerStyle: PropTypes.object,
        wrapperStyle: PropTypes.object,
        fields: PropTypes.arrayOf(PropTypes.object),
        actions: PropTypes.arrayOf(PropTypes.object),
        divider: PropTypes.object,
        links: PropTypes.arrayOf(PropTypes.object),
        socialButtonGroup: PropTypes.shape({
          style: PropTypes.object,
          buttons: PropTypes.arrayOf(PropTypes.object)
        }),
        layout: PropTypes.shape({
          type: PropTypes.string,
          labelCol: PropTypes.object,
          wrapperCol: PropTypes.object,
          requiredMark: PropTypes.oneOf(['optional', true, false])
        })
      })
    ).isRequired
  }).isRequired,
  form: PropTypes.object.isRequired,
  loading: PropTypes.bool,
  onFormSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.object
};

FormComponent.defaultProps = {
  loading: false,
  initialValues: {}
};

export default FormComponent;