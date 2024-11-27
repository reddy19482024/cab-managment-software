import React from 'react';
import { Form, Select, DatePicker, TimePicker, InputNumber, Checkbox, Radio } from 'antd';
import * as AntdIcons from '@ant-design/icons';
import PropTypes from 'prop-types';
import moment from 'moment';
import Button from './Button';
import Input from './Input';

const FormFieldRenderer = ({ field }) => {
  const getIcon = (iconName) => {
    if (!iconName) return null;
    if (React.isValidElement(iconName)) return iconName;
    const Icon = AntdIcons[iconName];
    return Icon ? <Icon /> : null;
  };

  const renderFormField = () => {
    switch (field.type) {
      case 'password':
        return (
          <Input
            type="password"
            {...field.inputProps}
            size={field.size}
            placeholder={field.placeholder}
            icon={field.prefix}
            iconPosition="prefix"
            allowClear={field.allowClear}
            theme={field.theme}
            variant={field.variant}
            borderless={field.borderless}
            round={field.round}
            customColors={field.customColors}
            tooltipTitle={field.tooltip}
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
            type="text"
            {...field.inputProps}
            size={field.size}
            placeholder={field.placeholder}
            icon={field.prefix}
            iconPosition="prefix"
            allowClear={field.allowClear}
            theme={field.theme}
            variant={field.variant}
            borderless={field.borderless}
            round={field.round}
            customColors={field.customColors}
            tooltipTitle={field.tooltip}
          />
        );
    }
  };

  return (
    <Form.Item
      name={field.name}
      label={field.type === 'checkbox' ? null : field.label}
      rules={field.rules}
      dependencies={field.dependencies}
      tooltip={field.tooltip}
      valuePropName={['checkbox', 'radio'].includes(field.type) ? 'checked' : 'value'}
    >
      {renderFormField()}
    </Form.Item>
  );
};

FormFieldRenderer.propTypes = {
  field: PropTypes.shape({
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
    dependencies: PropTypes.array,
    tooltip: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    inputProps: PropTypes.object,
    dropdownProps: PropTypes.object,
    checkboxProps: PropTypes.object,
    checkboxGroupProps: PropTypes.object,
    radioProps: PropTypes.object,
    radioGroupProps: PropTypes.object,
    options: PropTypes.array,
    size: PropTypes.string,
    placeholder: PropTypes.string,
    prefix: PropTypes.string,
    allowClear: PropTypes.bool,
    mode: PropTypes.string,
    onChange: PropTypes.func,
    children: PropTypes.node,
    // New props for custom Input component
    theme: PropTypes.oneOf(['light', 'dark']),
    variant: PropTypes.oneOf(['filled', 'outlined']),
    borderless: PropTypes.bool,
    round: PropTypes.bool,
    customColors: PropTypes.shape({
      background: PropTypes.string,
      text: PropTypes.string,
      border: PropTypes.string,
      hoverBorder: PropTypes.string,
      focusBorder: PropTypes.string,
      focusShadow: PropTypes.string,
    })
  }).isRequired
};

export default FormFieldRenderer;