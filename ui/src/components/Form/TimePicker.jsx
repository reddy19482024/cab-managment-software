

// TimePicker.jsx
import React from 'react';
import { TimePicker as AntTimePicker } from 'antd';
import PropTypes from 'prop-types';
import moment from 'moment';
import * as AntdIcons from '@ant-design/icons';

const TimePicker = ({
  value,
  onChange,
  format = 'HH:mm:ss',
  size = 'middle',
  placeholder,
  allowClear = true,
  disabled = false,
  style,
  className,
  use12Hours = false,
  hourStep = 1,
  minuteStep = 1,
  secondStep = 1,
  theme = 'light',
  variant = 'filled',
  borderless = false,
  round = false,
  customColors,
  tooltipTitle,
  tooltipPlacement = 'top',
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

  const timePickerProps = {
    value: value ? moment(value, format) : null,
    onChange,
    format,
    size,
    placeholder,
    allowClear,
    disabled,
    style: getThemeStyles(),
    className,
    use12Hours,
    hourStep,
    minuteStep,
    secondStep,
    ...rest,
  };

  const TimePickerComponent = (
    <AntTimePicker {...timePickerProps} />
  );

  if (tooltipTitle) {
    return (
      <AntdIcons.Tooltip title={tooltipTitle} placement={tooltipPlacement}>
        {TimePickerComponent}
      </AntdIcons.Tooltip>
    );
  }

  return TimePickerComponent;
};

TimePicker.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onChange: PropTypes.func,
  format: PropTypes.string,
  size: PropTypes.oneOf(['large', 'middle', 'small']),
  placeholder: PropTypes.string,
  allowClear: PropTypes.bool,
  disabled: PropTypes.bool,
  style: PropTypes.object,
  className: PropTypes.string,
  use12Hours: PropTypes.bool,
  hourStep: PropTypes.number,
  minuteStep: PropTypes.number,
  secondStep: PropTypes.number,
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
  tooltipTitle: PropTypes.node,
  tooltipPlacement: PropTypes.string,
};

export default TimePicker;