import React from 'react';
import { Form } from 'antd';
import * as AntdIcons from '@ant-design/icons';
import PropTypes from 'prop-types';
import moment from 'moment';
import Input from './Input';
import Select from './Select';
import Checkbox from './Checkbox';
import Radio from './Radio';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import InputNumber from './InputNumber';
import Switch from './Switch'; // Use this for rendering switches

const FormFieldRenderer = ({ field }) => {
  const getIcon = (iconName) => {
    if (!iconName) return null;
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
            showSearch={field.dropdownProps?.showSearch}
            labelInValue
            theme={field.theme}
            variant={field.variant}
            borderless={field.borderless}
            round={field.round}
            customColors={field.customColors}
            tooltipTitle={field.tooltip}
            virtualScroll={field.virtualScroll}
            suffixIcon={field.suffixIcon}
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={field.notFoundContent}
            loading={field.loading}
          />
        );

      case 'checkbox':
        return (
          <Checkbox
            {...field.checkboxProps}
            onChange={field.onChange}
            theme={field.theme}
            customColors={field.customColors}
            size={field.size}
            tooltipTitle={field.tooltip}
          >
            {field.checkboxLabel || field.label}
          </Checkbox>
        );

      case 'checkbox-group':
        return (
          <Checkbox.Group
            {...field.checkboxGroupProps}
            options={field.options}
            theme={field.theme}
            customColors={field.customColors}
            size={field.size}
          >
            {field.children}
          </Checkbox.Group>
        );

      case 'radio':
        return (
          <Radio
            {...field.radioProps}
            theme={field.theme}
            customColors={field.customColors}
            size={field.size}
            tooltipTitle={field.tooltip}
            buttonStyle={field.buttonStyle}
          >
            {field.radioLabel || field.label}
          </Radio>
        );

      case 'radio-group':
        return (
          <Radio.Group
            {...field.radioGroupProps}
            onChange={field.onChange}
            value={field.value}
            theme={field.theme}
            customColors={field.customColors}
            size={field.size}
            buttonStyle={field.buttonStyle}
          >
            {field.options.map((option) => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        );

      case 'switch':
        return (
          <Switch
            checked={field.value}
            onChange={field.onChange}
            size={field.size || 'default'}
            disabled={field.disabled || false}
            tooltipTitle={field.tooltip}
            customColors={field.customColors}
          />
        );

      case 'datetime':
        return (
          <DatePicker
            showTime={{
              format: 'HH:mm:ss',
              defaultValue: moment('00:00:00', 'HH:mm:ss')
            }}
            {...field.dateProps}
            size={field.size}
            placeholder={field.placeholder}
            format="YYYY-MM-DD HH:mm:ss"
            theme={field.theme}
            variant={field.variant}
            borderless={field.borderless}
            round={field.round}
            customColors={field.customColors}
            tooltipTitle={field.tooltip}
            disabledDate={field.disabledDate}
            disabledTime={field.disabledTime}
          />
        );

      case 'date':
        return (
          <DatePicker
            {...field.dateProps}
            size={field.size}
            placeholder={field.placeholder}
            format="YYYY-MM-DD"
            theme={field.theme}
            variant={field.variant}
            borderless={field.borderless}
            round={field.round}
            customColors={field.customColors}
            tooltipTitle={field.tooltip}
            disabledDate={field.disabledDate}
            showToday={field.showToday}
          />
        );

      case 'time':
        return (
          <TimePicker
            {...field.timeProps}
            size={field.size}
            placeholder={field.placeholder}
            format="HH:mm:ss"
            theme={field.theme}
            variant={field.variant}
            borderless={field.borderless}
            round={field.round}
            customColors={field.customColors}
            tooltipTitle={field.tooltip}
            use12Hours={field.use12Hours}
            hourStep={field.hourStep}
            minuteStep={field.minuteStep}
            secondStep={field.secondStep}
          />
        );

      case 'number':
        return (
          <InputNumber
            {...field.inputProps}
            size={field.size}
            placeholder={field.placeholder}
            theme={field.theme}
            variant={field.variant}
            borderless={field.borderless}
            round={field.round}
            customColors={field.customColors}
            tooltipTitle={field.tooltip}
            prefix={field.prefix}
            min={field.min}
            max={field.max}
            step={field.step}
            precision={field.precision}
            controls={field.controls}
            keyboard={field.keyboard}
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
      valuePropName={['checkbox', 'radio', 'switch'].includes(field.type) ? 'checked' : 'value'}
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
      'radio-group',
      'switch'
    ]).isRequired,
    label: PropTypes.string,
    rules: PropTypes.array,
    dependencies: PropTypes.array,
    tooltip: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    size: PropTypes.string,
    placeholder: PropTypes.string,
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
      checkedBackground: PropTypes.string,
      checkedBorder: PropTypes.string
    }),
    inputProps: PropTypes.object,
    prefix: PropTypes.string,
    allowClear: PropTypes.bool,
    dropdownProps: PropTypes.object,
    options: PropTypes.array,
    mode: PropTypes.string,
    virtualScroll: PropTypes.bool,
    suffixIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    notFoundContent: PropTypes.node,
    loading: PropTypes.bool,
    dateProps: PropTypes.object,
    disabledDate: PropTypes.func,
    disabledTime: PropTypes.func,
    showToday: PropTypes.bool,
    timeProps: PropTypes.object,
    use12Hours: PropTypes.bool,
    hourStep: PropTypes.number,
    minuteStep: PropTypes.number,
    secondStep: PropTypes.number,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    precision: PropTypes.number,
    controls: PropTypes.bool,
    keyboard: PropTypes.bool,
    checkboxProps: PropTypes.object,
    checkboxGroupProps: PropTypes.object,
    radioProps: PropTypes.object,
    radioGroupProps: PropTypes.object,
    buttonStyle: PropTypes.oneOf(['outline', 'solid']),
    onChange: PropTypes.func,
    children: PropTypes.node,
    disabled: PropTypes.bool,
    value: PropTypes.any
  }).isRequired
};

export default FormFieldRenderer;
