// DatePicker.jsx
import React from 'react';
import { DatePicker as AntDatePicker } from 'antd';
import PropTypes from 'prop-types';
import moment from 'moment';
import * as AntdIcons from '@ant-design/icons';

const DatePicker = ({
  value,
  onChange,
  format,
  showTime = false,
  size = 'middle',
  placeholder,
  allowClear = true,
  disabled = false,
  style,
  className,
  disabledDate,
  disabledTime,
  theme = 'light',
  variant = 'filled',
  borderless = false,
  round = false,
  customColors,
  showToday = true,
  showNow = true,
  tooltipTitle,
  tooltipPlacement = 'top',
  ranges,
  defaultPickerValue,
  ...rest
}) => {
  const getThemeStyles = () => {
    const baseStyles = {
      width: '100%',
      borderRadius: round ? '50px' : '2px',
      ...style,
    };

    if (customColors) {
      return {
        ...baseStyles,
        backgroundColor: customColors.background,
        color: customColors.text,
        borderColor: customColors.border,
        '&:hover': {
          borderColor: customColors.hoverBorder,
        },
        '&.ant-picker-focused': {
          borderColor: customColors.focusBorder,
          boxShadow: `0 0 0 2px ${customColors.focusShadow}`,
        },
      };
    }

    const themeStyles = {
      light: {
        filled: {
          backgroundColor: '#ffffff',
          border: borderless ? 'none' : '1px solid #d9d9d9',
        },
        outlined: {
          backgroundColor: 'transparent',
          border: '1px solid #d9d9d9',
        },
      },
      dark: {
        filled: {
          backgroundColor: '#1f1f1f',
          border: borderless ? 'none' : '1px solid #434343',
          color: '#ffffff',
        },
        outlined: {
          backgroundColor: 'transparent',
          border: '1px solid #434343',
          color: '#ffffff',
        },
      },
    };

    return {
      ...baseStyles,
      ...themeStyles[theme][variant],
    };
  };

  const datePickerProps = {
    value: value ? moment(value) : null,
    onChange,
    format,
    showTime,
    size,
    placeholder,
    allowClear,
    disabled,
    style: getThemeStyles(),
    className,
    disabledDate,
    disabledTime,
    showToday,
    showNow,
    ranges,
    defaultPickerValue: defaultPickerValue ? moment(defaultPickerValue) : null,
    ...rest,
  };

  const DatePickerComponent = (
    <AntDatePicker {...datePickerProps} />
  );

  if (tooltipTitle) {
    return (
      <AntdIcons.Tooltip title={tooltipTitle} placement={tooltipPlacement}>
        {DatePickerComponent}
      </AntdIcons.Tooltip>
    );
  }

  return DatePickerComponent;
};

DatePicker.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onChange: PropTypes.func,
  format: PropTypes.string,
  showTime: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  size: PropTypes.oneOf(['large', 'middle', 'small']),
  placeholder: PropTypes.string,
  allowClear: PropTypes.bool,
  disabled: PropTypes.bool,
  style: PropTypes.object,
  className: PropTypes.string,
  disabledDate: PropTypes.func,
  disabledTime: PropTypes.func,
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
  }),
  showToday: PropTypes.bool,
  showNow: PropTypes.bool,
  tooltipTitle: PropTypes.node,
  tooltipPlacement: PropTypes.string,
  ranges: PropTypes.object,
  defaultPickerValue: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};

export default DatePicker;