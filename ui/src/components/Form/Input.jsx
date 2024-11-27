
// Input.jsx
import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Input as AntInput } from 'antd';
import * as AntdIcons from '@ant-design/icons';

const Input = forwardRef(({
  type = 'text',
  size = 'middle',
  prefix,
  suffix,
  addonBefore,
  addonAfter,
  allowClear = false,
  bordered = true,
  disabled = false,
  maxLength,
  showCount = false,
  status,
  value,
  onChange,
  onPressEnter,
  placeholder,
  className,
  style,
  theme = 'light',
  variant = 'filled',
  borderless = false,
  round = false,
  width,
  height,
  customColors,
  icon,
  iconPosition = 'prefix',
  tooltipTitle,
  tooltipPlacement = 'top',
  autoComplete = 'off',
  ...rest
}, ref) => {
  // Handle icon rendering
  const getIcon = (iconName) => {
    if (!iconName) return null;
    if (React.isValidElement(iconName)) return iconName;
    const Icon = AntdIcons[iconName];
    return Icon ? <Icon /> : null;
  };

  // Custom theme styles
  const getThemeStyles = () => {
    const baseStyles = {
      width: width,
      height: height,
      borderRadius: round ? '50px' : '2px',
      ...style
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
        }
      };
    }

    const themeStyles = {
      light: {
        filled: {
          backgroundColor: '#ffffff',
          color: '#000000',
          border: borderless ? 'none' : '1px solid #d9d9d9',
        },
        outlined: {
          backgroundColor: 'transparent',
          color: '#000000',
          border: '1px solid #d9d9d9',
        }
      },
      dark: {
        filled: {
          backgroundColor: '#1f1f1f',
          color: '#ffffff',
          border: borderless ? 'none' : '1px solid #434343',
        },
        outlined: {
          backgroundColor: 'transparent',
          color: '#ffffff',
          border: '1px solid #434343',
        }
      }
    };

    return {
      ...baseStyles,
      ...themeStyles[theme][variant]
    };
  };

  const iconElement = getIcon(icon);
  const inputProps = {
    type,
    size,
    prefix: iconPosition === 'prefix' ? iconElement : prefix,
    suffix: iconPosition === 'suffix' ? iconElement : suffix,
    addonBefore,
    addonAfter,
    allowClear,
    bordered: !borderless && bordered,
    disabled,
    maxLength,
    showCount,
    status,
    value,
    onChange,
    onPressEnter,
    placeholder,
    className,
    style: getThemeStyles(),
    ref,
    autoComplete,
    ...rest
  };

  const InputComponent = type === 'password' ? AntInput.Password : AntInput;

  // If tooltip is provided, wrap input in tooltip
  if (tooltipTitle) {
    return (
      <AntdIcons.Tooltip title={tooltipTitle} placement={tooltipPlacement}>
        <InputComponent {...inputProps} />
      </AntdIcons.Tooltip>
    );
  }

  return <InputComponent {...inputProps} />;
});

Input.propTypes = {
  type: PropTypes.string,
  size: PropTypes.oneOf(['large', 'middle', 'small']),
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  addonBefore: PropTypes.node,
  addonAfter: PropTypes.node,
  allowClear: PropTypes.bool,
  bordered: PropTypes.bool,
  disabled: PropTypes.bool,
  maxLength: PropTypes.number,
  showCount: PropTypes.bool,
  status: PropTypes.oneOf(['error', 'warning']),
  value: PropTypes.string,
  onChange: PropTypes.func,
  onPressEnter: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  theme: PropTypes.oneOf(['light', 'dark']),
  variant: PropTypes.oneOf(['filled', 'outlined']),
  borderless: PropTypes.bool,
  round: PropTypes.bool,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  customColors: PropTypes.shape({
    background: PropTypes.string,
    text: PropTypes.string,
    border: PropTypes.string,
    hoverBorder: PropTypes.string,
    focusBorder: PropTypes.string,
    focusShadow: PropTypes.string,
  }),
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  iconPosition: PropTypes.oneOf(['prefix', 'suffix']),
  tooltipTitle: PropTypes.node,
  tooltipPlacement: PropTypes.string,
  autoComplete: PropTypes.string,
};

Input.TextArea = forwardRef((props, ref) => (
  <AntInput.TextArea {...props} ref={ref} />
));

export default Input;