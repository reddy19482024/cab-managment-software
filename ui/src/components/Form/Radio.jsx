import React from 'react';
import { Radio as AntRadio } from 'antd';
import PropTypes from 'prop-types';

const Radio = ({
  children,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  value,
  style,
  className,
  theme = 'light',
  customColors,
  size = 'middle',
  buttonStyle = 'outline',
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
        '.ant-radio-checked .ant-radio-inner': {
          borderColor: customColors.checkedBorder,
        },
        '.ant-radio-checked .ant-radio-inner::after': {
          backgroundColor: customColors.checkedBackground,
        },
        '.ant-radio:hover .ant-radio-inner': {
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
        '.ant-radio-inner': {
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

  const radioProps = {
    checked,
    defaultChecked,
    disabled,
    onChange,
    value,
    style: getThemeStyles(),
    className,
    ...rest,
  };

  const RadioComponent = (
    <AntRadio {...radioProps}>{children}</AntRadio>
  );

  if (tooltipTitle) {
    return (
      <AntdIcons.Tooltip title={tooltipTitle} placement={tooltipPlacement}>
        {RadioComponent}
      </AntdIcons.Tooltip>
    );
  }

  return RadioComponent;
};

// Add Radio.Group and Radio.Button
Radio.Group = AntRadio.Group;
Radio.Button = AntRadio.Button;

Radio.propTypes = {
  children: PropTypes.node,
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.any,
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
  buttonStyle: PropTypes.oneOf(['outline', 'solid']),
  tooltipTitle: PropTypes.node,
  tooltipPlacement: PropTypes.string,
};

export default Radio;