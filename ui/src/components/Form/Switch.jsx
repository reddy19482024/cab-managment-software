import React, { useState } from 'react';
import { Switch as AntSwitch, Tooltip } from 'antd'; // Import Tooltip directly from antd
import PropTypes from 'prop-types';

const Switch = ({
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  size = 'default',
  style,
  className,
  theme = 'light',
  customColors,
  tooltipTitle,
  tooltipPlacement = 'top',
  loading = false,
  ...rest
}) => {
  const [isChecked, setIsChecked] = useState(defaultChecked || checked);

  const getThemeStyles = () => {
    const baseStyles = {
      ...style,
    };

    if (customColors) {
      return {
        ...baseStyles,
        backgroundColor: isChecked
          ? customColors.activeBackground || '#4caf50'
          : customColors.inactiveBackground || '#f44336',
        borderColor: customColors.border,
        color: customColors.text,
      };
    }

    const themeStyles = {
      light: {
        backgroundColor: isChecked ? '#4caf50' : '#f44336',
        borderColor: '#d9d9d9',
        color: '#000000',
      },
      dark: {
        backgroundColor: isChecked ? '#4caf50' : '#f44336',
        borderColor: '#1f1f1f',
        color: '#ffffff',
      },
    };

    return {
      ...baseStyles,
      ...themeStyles[theme],
    };
  };

  const handleChange = (checked) => {
    setIsChecked(checked);
    if (onChange) {
      onChange(checked);
    }
  };

  const switchProps = {
    checked: isChecked,
    defaultChecked,
    disabled,
    onChange: handleChange,
    size,
    style: getThemeStyles(),
    className,
    loading,
    ...rest,
  };

  const SwitchComponent = <AntSwitch {...switchProps} />;

  if (tooltipTitle) {
    return (
      <Tooltip title={tooltipTitle} placement={tooltipPlacement}>
        {SwitchComponent}
      </Tooltip>
    );
  }

  return SwitchComponent;
};

Switch.propTypes = {
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['small', 'default']),
  style: PropTypes.object,
  className: PropTypes.string,
  theme: PropTypes.oneOf(['light', 'dark']),
  customColors: PropTypes.shape({
    background: PropTypes.string,
    activeBackground: PropTypes.string, // Active state color
    inactiveBackground: PropTypes.string, // Inactive state color
    border: PropTypes.string,
    text: PropTypes.string,
  }),
  tooltipTitle: PropTypes.node,
  tooltipPlacement: PropTypes.string,
  loading: PropTypes.bool,
};

export default Switch;
