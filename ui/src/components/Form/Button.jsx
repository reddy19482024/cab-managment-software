// Button.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Button as AntButton } from 'antd';
import * as AntdIcons from '@ant-design/icons';

const Button = ({
  children,
  type = 'default',
  size = 'middle',
  icon,
  shape,
  block,
  danger,
  ghost,
  href,
  htmlType = 'button',
  loading = false,
  target,
  disabled = false,
  onClick,
  className,
  style,
  theme = 'light',
  variant = 'filled',
  borderless = false,
  iconPosition = 'left',
  tooltipTitle,
  tooltipPlacement = 'top',
  width,
  height,
  customColors,
  ...rest
}) => {
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
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      width: block ? '100%' : width,
      height: height,
      ...style
    };

    if (customColors) {
      return {
        ...baseStyles,
        backgroundColor: customColors.background,
        color: customColors.text,
        borderColor: customColors.border,
        '&:hover': {
          backgroundColor: customColors.hoverBackground,
          color: customColors.hoverText,
          borderColor: customColors.hoverBorder,
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
  const buttonContent = (
    <>
      {iconPosition === 'left' && iconElement}
      {children}
      {iconPosition === 'right' && iconElement}
    </>
  );

  const buttonProps = {
    type,
    size,
    shape,
    block,
    danger,
    ghost,
    href,
    htmlType,
    loading,
    target,
    disabled,
    onClick,
    className,
    style: getThemeStyles(),
    ...rest
  };

  // If tooltip is provided, wrap button in tooltip
  if (tooltipTitle) {
    return (
      <AntdIcons.Tooltip title={tooltipTitle} placement={tooltipPlacement}>
        <AntButton {...buttonProps}>{buttonContent}</AntButton>
      </AntdIcons.Tooltip>
    );
  }

  return <AntButton {...buttonProps}>{buttonContent}</AntButton>;
};

Button.propTypes = {
  children: PropTypes.node,
  type: PropTypes.oneOf(['primary', 'default', 'dashed', 'link', 'text']),
  size: PropTypes.oneOf(['large', 'middle', 'small']),
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  shape: PropTypes.oneOf(['default', 'circle', 'round']),
  block: PropTypes.bool,
  danger: PropTypes.bool,
  ghost: PropTypes.bool,
  href: PropTypes.string,
  htmlType: PropTypes.oneOf(['button', 'submit', 'reset']),
  loading: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  target: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object,
  theme: PropTypes.oneOf(['light', 'dark']),
  variant: PropTypes.oneOf(['filled', 'outlined']),
  borderless: PropTypes.bool,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  tooltipTitle: PropTypes.node,
  tooltipPlacement: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  customColors: PropTypes.shape({
    background: PropTypes.string,
    text: PropTypes.string,
    border: PropTypes.string,
    hoverBackground: PropTypes.string,
    hoverText: PropTypes.string,
    hoverBorder: PropTypes.string,
  })
};

export default Button;
