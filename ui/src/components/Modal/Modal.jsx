import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, Spin } from 'antd';
import PropTypes from 'prop-types';
import * as AntdIcons from '@ant-design/icons';
import useApi from '../../hooks/useApi';

const ModalComponent = ({
  config,
  visible,
  onClose,
  onSubmit,
  loading,
  form,
  record
}) => {
  if (!config) return null;
  const { apiRequest } = useApi();

  useEffect(() => {
    if (visible && config.fields) {
      form.resetFields();
      if (record) {
        form.setFieldsValue(record);
      }
      loadSelectFieldOptions();
    }
  }, [visible, config, record]);

  const loadSelectFieldOptions = async () => {
    const selectFields = config.fields.filter(field => field.type === 'select' && field.api);
  
    for (const field of selectFields) {
      try {
        let endpoint = field.api.endpoint;
        if (field.api.method === 'GET' && field.api.params) {
          const queryString = new URLSearchParams(field.api.params).toString();
          endpoint = `${endpoint}${queryString ? '?' + queryString : ''}`;
        }
  
        const response = await apiRequest(
          endpoint,
          field.api.method || 'GET',
          field.api.method === 'GET' ? null : field.api.params
        );
  
        if (response?.data) {
          // Use fieldNames to dynamically determine label and value keys
          const { label: labelKey = 'label', value: valueKey = '_id' } = field.fieldNames || {};
  
          const options = response.data.map(item => ({
            label: item[labelKey] || '', // Use the key defined in fieldNames for label
            value: item[valueKey],      // Use the key defined in fieldNames for value
          }));
  
          field.options = options;
  
          // Check if the current form value needs to be updated with the matching option
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

  const renderField = (field) => {
    switch (field.type) {
      case 'select':
        return (
          <Select
            {...field.dropdownProps}
            options={field.options}
            size={field.size}
            placeholder={field.placeholder}
            labelInValue
            showSearch={field.dropdownProps?.showSearch}
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            size={field.size}
            {...field.inputProps}
          />
        );

      default:
        return (
          <Input
            placeholder={field.placeholder}
            size={field.size}
            allowClear
            {...field.inputProps}
          />
        );
    }
  };

  const renderFormFields = () => (
    config.fields?.map((field, index) => (
      <Form.Item
        key={`${field.name}-${index}`}
        name={field.name}
        label={field.label}
        rules={field.rules}
      >
        {renderField(field)}
      </Form.Item>
    ))
  );

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const transformedValues = Object.entries(values).reduce((acc, [key, value]) => {
        acc[key] = value?.value !== undefined ? value.value : value;
        return acc;
      }, {});

      onSubmit(transformedValues);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  if (config.type === 'confirm') {
    return (
      <Modal
        title={config.title}
        open={visible}
        onCancel={onClose}
        width={config.width}
        maskClosable={false}
        destroyOnClose
        footer={
          <Space>
            {config.actions?.map((action, index) => (
              <Button
                key={index}
                {...action.buttonProps}
                onClick={() => {
                  if (action.onClick?.type === 'close') {
                    onClose();
                  } else if (action.buttonProps?.htmlType === 'submit') {
                    handleSubmit();
                  }
                }}
                loading={action.buttonProps?.htmlType === 'submit' && loading}
                icon={action.buttonProps?.icon && getIcon(action.buttonProps?.icon)}
              >
                {action.label}
              </Button>
            ))}
          </Space>
        }
      >
        <div>{config.content}</div>
      </Modal>
    );
  }

  return (
    <Modal
      title={config.title}
      open={visible}
      onCancel={onClose}
      width={config.width}
      maskClosable={false}
      destroyOnClose
      footer={
        <Space>
          {config.actions?.map((action, index) => (
            <Button
              key={index}
              {...action.buttonProps}
              onClick={() => {
                if (action.onClick?.type === 'close') {
                  onClose();
                } else if (action.buttonProps?.htmlType === 'submit') {
                  handleSubmit();
                }
              }}
              loading={action.buttonProps?.htmlType === 'submit' && loading}
              icon={action.buttonProps?.icon && getIcon(action.buttonProps?.icon)}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout={config.layout?.type || 'vertical'}
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
      type: PropTypes.oneOf(['text', 'select', 'number']).isRequired,
      label: PropTypes.string,
      placeholder: PropTypes.string,
      size: PropTypes.string,
      rules: PropTypes.array,
      dependencies: PropTypes.arrayOf(PropTypes.string),
      options: PropTypes.array,
      api: PropTypes.shape({
        endpoint: PropTypes.string,
        method: PropTypes.string,
        params: PropTypes.object
      }),
      fieldNames: PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.string
      }),
      dropdownProps: PropTypes.object,
      inputProps: PropTypes.object
    })),
    actions: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      buttonProps: PropTypes.object,
      onClick: PropTypes.object
    }))
  }),
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  form: PropTypes.object.isRequired,
  record: PropTypes.object
};

ModalComponent.defaultProps = {
  loading: false,
  record: {}
};

export default ModalComponent;
