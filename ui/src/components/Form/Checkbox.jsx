import React from 'react';
import { Checkbox as AntCheckbox } from 'antd';
import PropTypes from 'prop-types';

const Checkbox = ({
  children,
  checked,
  defaultChecked,
  disabled = false,
  indeterminate = false,
  onChange,
  style,
  className,
  theme = 'light',
  customColors,
  size = 'middle',
  tooltipTitle,
  tooltipPlacement = 'top',
  ...rest
}) => {
  const getThemeStyles = () => {
    const baseStyles = {
      ...style,
    };

    if (customColors) {
      return {
        ...baseStyles,
        '.ant-checkbox-checked .ant-checkbox-inner': {
          backgroundColor: customColors.checkedBackground,
          borderColor: customColors.checkedBorder,
        },
        '.ant-checkbox-wrapper:hover .ant-checkbox-inner': {
          borderColor: customColors.hoverBorder,
        },
        color: customColors.text,
      };
    }

    const themeStyles = {
      light: {
        color: '#000000',
      },
      dark: {
        color: '#ffffff',
        '.ant-checkbox-inner': {
          backgroundColor: '#1f1f1f',
          borderColor: '#434343',
        },
      },
    };

    return {
      ...baseStyles,
      ...themeStyles[theme],
    };
  };

  const checkboxProps = {
    checked,
    defaultChecked,
    disabled,
    indeterminate,
    onChange,
    style: getThemeStyles(),
    className,
    ...rest,
  };

  const CheckboxComponent = (
    <AntCheckbox {...checkboxProps}>{children}</AntCheckbox>
  );

  if (tooltipTitle) {
    return (
      <AntdIcons.Tooltip title={tooltipTitle} placement={tooltipPlacement}>
        {CheckboxComponent}
      </AntdIcons.Tooltip>
    );
  }

  return CheckboxComponent;
};

Checkbox.Group = AntCheckbox.Group;

Checkbox.propTypes = {
  children: PropTypes.node,
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
  disabled: PropTypes.bool,
  indeterminate: PropTypes.bool,
  onChange: PropTypes.func,
  style: PropTypes.object,
  className: PropTypes.string,
  theme: PropTypes.oneOf(['light', 'dark']),
  customColors: PropTypes.shape({
    checkedBackground: PropTypes.string,
    checkedBorder: PropTypes.string,
    hoverBorder: PropTypes.string,
    text: PropTypes.string,
  }),
  size: PropTypes.oneOf(['large', 'middle', 'small']),
  tooltipTitle: PropTypes.node,
  tooltipPlacement: PropTypes.string,
};

export default Checkbox;