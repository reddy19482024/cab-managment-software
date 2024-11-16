// src/components/Modal/ModalComponent.jsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, Spin } from 'antd';
import PropTypes from 'prop-types';
import * as AntdIcons from '@ant-design/icons';

const ModalComponent = ({
  config,
  visible,
  onClose,
  onSubmit,
  loading,
  form,
  record,
  dependentFieldsData,
  fieldLoading,
  onFieldWatch
}) => {
  if (!config) return null;

  // Reset form and load initial data when modal opens/closes
  useEffect(() => {
    if (visible) {
      if (record) {
        const initialValues = {};
        config.fields?.forEach(field => {
          // Handle nested values for select fields
          if (field.type === 'select' && record[field.name]) {
            const value = record[field.name];
            // If the value is already in the correct format, use it directly
            if (value && typeof value === 'object' && value.value) {
              initialValues[field.name] = value;
            } else {
              // Otherwise, create the select option format
              initialValues[field.name] = {
                label: record[`${field.name}_label`] || value,
                value: value
              };
            }
          } else {
            initialValues[field.name] = record[field.name];
          }
        });
        form.setFieldsValue(initialValues);

        // Load dependent field data for edit mode
        config.fields?.forEach(field => {
          if (field.api && field.dependencies) {
            const dependencyValues = field.dependencies.reduce((acc, dep) => {
              acc[dep] = initialValues[dep]?.value || initialValues[dep];
              return acc;
            }, {});

            // Check if dependencies are met
            const shouldLoadData = !field.dependencies.some(dep => 
              !dependencyValues[dep]
            );

            if (shouldLoadData) {
              onFieldWatch(
                {},
                initialValues,
                {
                  field: field.name,
                  action: 'RELOAD_OPTIONS',
                  params: {
                    ...field.api.params,
                    includeIds: initialValues[field.name]?.value || initialValues[field.name]
                  }
                }
              );
            }
          }
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, record, config]);

  // Helper function to get icon component
  const getIcon = (iconName) => {
    if (!iconName) return null;
    const Icon = AntdIcons[iconName];
    return Icon ? <Icon /> : null;
  };

  // Handle dependency changes
  const handleDependencyChange = (changedValues, allValues) => {
    if (!onFieldWatch) return;

    const changedField = Object.keys(changedValues)[0];
    
    // Find fields that depend on the changed field
    config.fields?.forEach(field => {
      if (field.watchConfig) {
        Object.entries(field.watchConfig).forEach(([key, config]) => {
          if (config.field === changedField) {
            const watchValue = allValues[changedField]?.value || allValues[changedField];
            const condition = config.conditions?.[watchValue];

            if (condition) {
              // Handle dependent field updates
              onFieldWatch(
                changedValues,
                allValues,
                {
                  field: field.name,
                  action: condition.action,
                  params: {
                    ...field.api?.params,
                    ...condition.params
                  }
                }
              );

              // Clear dependent field if specified
              if (condition.action === 'CLEAR_VALUE') {
                form.setFieldValue(field.name, undefined);
              }
            }
          }
        });
      }
    });
  };

  // Custom validator for dependent fields
  const createFieldValidator = (validator) => async (rule, value) => {
    const { type, params, message } = validator;

    switch (type) {
      case 'STATUS_VEHICLE_MATCH':
        const status = form.getFieldValue('status')?.value || form.getFieldValue('status');
        
        if (params.requiredStatus && status === params.requiredStatus && !value) {
          throw new Error(message);
        }
        if (params.status && status === params.status && value) {
          throw new Error(message);
        }
        break;

      default:
        break;
    }
  };

  // Process validation rules
  const getFieldRules = (field) => {
    const rules = [...(field.rules || [])];

    if (field.validators) {
      field.validators.forEach(validator => {
        rules.push({
          validator: createFieldValidator(validator),
          message: validator.message
        });
      });
    }

    return rules;
  };

  // Render form field
  const renderField = (field) => {
    switch (field.type) {
      case 'select':
        const options = field.api 
          ? (dependentFieldsData[field.name] || [])
          : field.options;

        return (
          <Select
            {...field.dropdownProps}
            loading={fieldLoading[field.name]}
            options={options}
            disabled={field.disabled}
            size={field.size}
            placeholder={field.placeholder}
            labelInValue // Important for handling selected values
            showSearch={field.dropdownProps?.showSearch}
            filterOption={(input, option) => 
              option.label.toLowerCase().includes(input.toLowerCase())
            }
          />
        );

      case 'text':
      default:
        return (
          <Input
            placeholder={field.placeholder}
            size={field.size}
            disabled={field.disabled}
            allowClear
          />
        );
    }
  };

  // Render form fields
  const renderFormFields = () => {
    if (!config.fields) return null;

    return config.fields.map((field, index) => (
      <Form.Item
        key={index}
        name={field.name}
        label={field.label}
        rules={getFieldRules(field)}
        dependencies={field.dependencies}
        validateTrigger={['onBlur', 'onChange']}
      >
        {renderField(field)}
      </Form.Item>
    ));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // Render modal footer actions
  const renderFooter = () => {
    if (!config.actions) return null;

    return (
      <Space>
        {config.actions.map((action, index) => {
          const isSubmitButton = action.buttonProps?.htmlType === 'submit';

          return (
            <Button
              key={index}
              {...action.buttonProps}
              onClick={() => {
                if (action.onClick?.type === 'close') {
                  onClose();
                } else if (isSubmitButton) {
                  handleSubmit();
                }
              }}
              loading={isSubmitButton && loading}
              icon={action.buttonProps?.icon && getIcon(action.buttonProps.icon)}
            >
              {action.label}
            </Button>
          );
        })}
      </Space>
    );
  };

  // Render confirm modal
  if (config.type === 'confirm') {
    return (
      <Modal
        title={config.title}
        open={visible}
        onCancel={onClose}
        footer={renderFooter()}
        width={config.width}
        maskClosable={false}
        destroyOnClose
      >
        <div>{config.content}</div>
      </Modal>
    );
  }

  // Render form modal
  return (
    <Modal
      title={config.title}
      open={visible}
      onCancel={onClose}
      footer={renderFooter()}
      width={config.width}
      maskClosable={false}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout={config.layout?.type || 'vertical'}
          onValuesChange={handleDependencyChange}
        >
          {renderFormFields()}
        </Form>
      </Spin>
    </Modal>
  );
};


ModalComponent.propTypes = {
  config: PropTypes.shape({
    title: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['confirm', 'form']),
    width: PropTypes.number,
    layout: PropTypes.shape({
      type: PropTypes.oneOf(['vertical', 'horizontal', 'inline'])
    }),
    fields: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['text', 'select']).isRequired,
      label: PropTypes.string,
      placeholder: PropTypes.string,
      size: PropTypes.oneOf(['small', 'middle', 'large']),
      disabled: PropTypes.bool,
      required: PropTypes.bool,
      rules: PropTypes.array,
      options: PropTypes.array,
      dependencies: PropTypes.arrayOf(PropTypes.string),
      api: PropTypes.shape({
        endpoint: PropTypes.string,
        method: PropTypes.string,
        params: PropTypes.object,
        transform: PropTypes.object
      }),
      watchConfig: PropTypes.object,
      validators: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string.isRequired,
        message: PropTypes.string.isRequired,
        params: PropTypes.object
      })),
      dropdownProps: PropTypes.object
    })),
    actions: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      buttonProps: PropTypes.object,
      onClick: PropTypes.shape({
        type: PropTypes.oneOf(['submit', 'close'])
      }),
      api: PropTypes.object,
      messages: PropTypes.object
    }))
  }),
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  form: PropTypes.object.isRequired,
  record: PropTypes.object,
  dependentFieldsData: PropTypes.object,
  fieldLoading: PropTypes.object,
  onFieldWatch: PropTypes.func
};

ModalComponent.defaultProps = {
  loading: false,
  dependentFieldsData: {},
  fieldLoading: {},
  record: {}
};

export default ModalComponent;