import React, { useEffect } from 'react';
import { Form, Divider } from 'antd';
import * as AntdIcons from '@ant-design/icons';
import PropTypes from 'prop-types';
import moment from 'moment';
import useApi from '../../hooks/useApi';
import FormFieldRenderer from './FormFieldRenderer';
import Button from './Button'; // Import custom Button component

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

  const processTransform = (value, transformMap) => {
    if (!value || !transformMap) return value;
    
    if (typeof value === 'object') {
      const transformedValue = {};
      Object.entries(transformMap).forEach(([key, path]) => {
        const val = path.split('.').reduce((obj, p) => obj?.[p], value);
        if (val !== undefined) {
          transformedValue[key] = val;
        }
      });
      return transformedValue;
    }
    
    return value;
  };

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
            formattedValues[key] = value.map(v => ({
              key: v,  // Add this
              value: v,
              label: options.find(opt => opt.value === v)?.label || v
            }));
          } else {
            const options = await ensureOptionsLoaded(field, [value]);
            formattedValues[key] = {
              key: value,  // Add this
              value: value,
              label: options.find(opt => opt.value === value)?.label || value
            };
          }
          break;
          case 'profileimage':
            // Use the response transform configuration from the field
            if (field.uploadProps?.transform) {
              const transformMap = field.uploadProps.transform;
              const transformedUrl = transformMap.thumbnail?.split('.').reduce((obj, key) => obj?.[key], value);
              formattedValues[key] = transformedUrl || value;
            } else {
              formattedValues[key] = value;
            }
            break;
        case 'date':
        case 'datetime':
        case 'time':
          formattedValues[key] = value ? moment(value) : null;
          break;
        
        case 'number':
          formattedValues[key] = typeof value === 'string' ? parseFloat(value) : value;
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
              acc[key] = Array.isArray(value) ? value.map(v => v.value || v) : [];
            } else {
              acc[key] = value?.value || value;
            }
            break;
            case 'profileimage':
              // Use the response transform configuration from the field
              if (typeof value === 'object' && field.uploadProps?.transform) {
                const transformMap = field.uploadProps.transform;
                const transformedValue = {};
                Object.entries(transformMap).forEach(([key, path]) => {
                  // Create nested structure based on the path
                  path.split('.').reduce((obj, part, index, arr) => {
                    if (index === arr.length - 1) {
                      obj[part] = value[key];
                    } else {
                      obj[part] = obj[part] || {};
                    }
                    return obj[part];
                  }, transformedValue);
                });
                acc[key] = transformedValue;
              } else {
                acc[key] = value;
              }
              break;
          case 'date':
          case 'datetime':
          case 'time':
            acc[key] = value ? value.toISOString() : null;
            break;
          
          case 'number':
            acc[key] = typeof value === 'string' ? parseFloat(value) : value;
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
        {/* ... keep existing title section ... */}
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
            <FormFieldRenderer 
            key={field.name} 
            field={{
              ...field,
              value: form.getFieldValue(field.name),
              onChange: (value) => {
                // Process any transformations defined in the field config
                const transformedValue = field.uploadProps?.transform ? 
                  processTransform(value, field.uploadProps.transform) : 
                  value;
                form.setFieldValue(field.name, transformedValue);
              }
            }}
            />          
            ))}

          {formSection.actions?.map((action, index) => (
            <Form.Item key={index} style={action.style}>
              <Button
                {...action.buttonProps}
                loading={loading && action.buttonProps?.htmlType === 'submit'}
                icon={action.buttonProps?.icon}
                theme={action.theme || 'light'}
                variant={action.variant || 'filled'}
                borderless={action.borderless}
                iconPosition={action.iconPosition || 'left'}
                tooltipTitle={action.tooltip}
                width={action.width}
                height={action.height}
                customColors={action.customColors}
                onClick={() => {
                  if (action.onClick?.type === 'modal') {
                    // Handle modal action
                  } else if (action.buttonProps?.htmlType === 'submit') {
                    form.submit();
                  }
                  action.onClick?.handler?.();
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
                  theme={button.theme || 'light'}
                  variant={button.variant || 'outlined'}
                  borderless={button.borderless}
                  iconPosition={button.iconPosition || 'left'}
                  tooltipTitle={button.tooltip}
                  width={button.width}
                  height={button.height}
                  customColors={button.customColors}
                  icon={button.buttonProps?.icon}
                  style={button.style}
                  aria-label={button.ariaLabel}
                  onClick={button.onClick}
                />
              ))}
            </div>
          )}

          {/* ... keep existing links section ... */}
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
        actions: PropTypes.arrayOf(
          PropTypes.shape({
            label: PropTypes.string,
            buttonProps: PropTypes.object,
            style: PropTypes.object,
            onClick: PropTypes.shape({
              type: PropTypes.string,
              handler: PropTypes.func
            }),
            theme: PropTypes.oneOf(['light', 'dark']),
            variant: PropTypes.oneOf(['filled', 'outlined']),
            borderless: PropTypes.bool,
            iconPosition: PropTypes.oneOf(['left', 'right']),
            tooltip: PropTypes.node,
            width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            customColors: PropTypes.shape({
              background: PropTypes.string,
              text: PropTypes.string,
              border: PropTypes.string,
              hoverBackground: PropTypes.string,
              hoverText: PropTypes.string,
              hoverBorder: PropTypes.string
            })
          })
        ),
        divider: PropTypes.object,
        links: PropTypes.arrayOf(PropTypes.object),
        socialButtonGroup: PropTypes.shape({
          style: PropTypes.object,
          buttons: PropTypes.arrayOf(
            PropTypes.shape({
              buttonProps: PropTypes.object,
              style: PropTypes.object,
              ariaLabel: PropTypes.string,
              onClick: PropTypes.func,
              theme: PropTypes.oneOf(['light', 'dark']),
              variant: PropTypes.oneOf(['filled', 'outlined']),
              borderless: PropTypes.bool,
              iconPosition: PropTypes.oneOf(['left', 'right']),
              tooltip: PropTypes.node,
              width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
              height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
              customColors: PropTypes.shape({
                background: PropTypes.string,
                text: PropTypes.string,
                border: PropTypes.string,
                hoverBackground: PropTypes.string,
                hoverText: PropTypes.string,
                hoverBorder: PropTypes.string
              })
            })
          )
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