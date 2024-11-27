//InputNumber.jsx
import React from 'react';
import { InputNumber as AntInputNumber } from 'antd';
import PropTypes from 'prop-types';
import * as AntdIcons from '@ant-design/icons';

const InputNumber = ({
  value,
  onChange,
  size = 'middle',
  min,
  max,
  step = 1,
  precision,
  placeholder,
  disabled = false,
  controls = true,
  keyboard = true,
  style,
  className,
  prefix,
  theme = 'light',
  variant = 'filled',
  borderless = false,
  round = false,
  customColors,
  tooltipTitle,
  tooltipPlacement = 'top',
  ...rest
}) => {
  const getIcon = (iconName) => {
    if (!iconName) return null;
    if (React.isValidElement(iconName)) return iconName;
    const Icon = AntdIcons[iconName];
    return Icon ? <Icon /> : null;
  };

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
        '&:focus': {
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

  const inputNumberProps = {
    value,
    onChange,
    size,
    min,
    max,
    step,
    precision,
    placeholder,
    disabled,
    controls,
    keyboard,
    style: getThemeStyles(),
    className,
    prefix: prefix && getIcon(prefix),
    ...rest,
  };

  const InputNumberComponent = (
    <AntInputNumber {...inputNumberProps} />
  );

  if (tooltipTitle) {
    return (
      <AntdIcons.Tooltip title={tooltipTitle} placement={tooltipPlacement}>
        {InputNumberComponent}
      </AntdIcons.Tooltip>
    );
  }

  return InputNumberComponent;
};

InputNumber.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
  size: PropTypes.oneOf(['large', 'middle', 'small']),
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  precision: PropTypes.number,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  controls: PropTypes.bool,
  keyboard: PropTypes.bool,
  style: PropTypes.object,
  className: PropTypes.string,
  prefix: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
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

export default InputNumber;