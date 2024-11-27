import React from 'react';
import { Select as AntSelect, Tooltip } from 'antd';
import PropTypes from 'prop-types';
import * as AntdIcons from '@ant-design/icons';

const Select = ({
  options = [],
  value,
  onChange,
  mode,
  size = 'middle',
  placeholder,
  allowClear = false,
  showSearch = false,
  loading = false,
  disabled = false,
  style,
  className,
  dropdownStyle,
  dropdownClassName,
  theme = 'light',
  variant = 'filled',
  borderless = false,
  round = false,
  width,
  maxTagCount,
  customColors,
  onSearch,
  filterOption,
  notFoundContent,
  suffixIcon,
  clearIcon,
  virtualScroll = true,
  tooltipTitle,
  tooltipPlacement = 'top',
  fieldNames,
  labelInValue = true,
  optionFilterProp = 'label',
  optionLabelProp = 'label',
  defaultActiveFirstOption = true,
  popupMatchSelectWidth = true,
  defaultOpen = false,
  autoClearSearchValue = true,
  dropdownRender,
  onDropdownVisibleChange,
  onClear,
  onFocus,
  onBlur,
  onDeselect,
  onPopupScroll,
  onSelect,
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
      width: width || '100%',
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
        '&.ant-select-focused': {
          borderColor: customColors.focusBorder,
          boxShadow: `0 0 0 2px ${customColors.focusShadow}`,
        },
        '.ant-select-selection-item': {
          color: customColors.text,
        },
        '.ant-select-arrow': {
          color: customColors.text,
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
          '.ant-select-selection-item': {
            color: '#ffffff',
          },
          '.ant-select-arrow': {
            color: '#ffffff',
          },
        },
        outlined: {
          backgroundColor: 'transparent',
          border: '1px solid #434343',
          color: '#ffffff',
          '.ant-select-selection-item': {
            color: '#ffffff',
          },
          '.ant-select-arrow': {
            color: '#ffffff',
          },
        },
      },
    };

    return {
      ...baseStyles,
      ...themeStyles[theme][variant],
    };
  };

  const handleChange = (selectedValue, option) => {
    if (onChange) {
      onChange(selectedValue, option);
    }
  };

  const selectProps = {
    value,
    onChange: handleChange,
    mode,
    size,
    placeholder,
    allowClear,
    showSearch,
    loading,
    disabled,
    style: getThemeStyles(),
    className,
    dropdownStyle: {
      ...dropdownStyle,
      backgroundColor: theme === 'dark' ? '#1f1f1f' : '#ffffff',
      borderColor: theme === 'dark' ? '#434343' : '#d9d9d9',
    },
    dropdownClassName,
    maxTagCount,
    onSearch,
    filterOption: filterOption || ((input, option) =>
      option?.[optionFilterProp]?.toLowerCase().includes(input.toLowerCase())
    ),
    notFoundContent,
    suffixIcon: getIcon(suffixIcon),
    clearIcon: getIcon(clearIcon),
    virtual: virtualScroll,
    options,
    labelInValue,
    optionFilterProp,
    optionLabelProp,
    defaultActiveFirstOption,
    popupMatchSelectWidth,
    defaultOpen,
    autoClearSearchValue,
    dropdownRender,
    fieldNames,
    onDropdownVisibleChange,
    onClear,
    onFocus,
    onBlur,
    onDeselect,
    onPopupScroll,
    onSelect,
    ...rest,
  };

  const SelectComponent = <AntSelect {...selectProps} />;

  if (tooltipTitle) {
    return (
      <Tooltip title={tooltipTitle} placement={tooltipPlacement}>
        {SelectComponent}
      </Tooltip>
    );
  }

  return SelectComponent;
};

Select.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node.isRequired,
      value: PropTypes.any.isRequired,
      disabled: PropTypes.bool,
      children: PropTypes.arrayOf(PropTypes.object),
    })
  ),
  value: PropTypes.any,
  onChange: PropTypes.func,
  mode: PropTypes.oneOf(['multiple', 'tags']),
  size: PropTypes.oneOf(['large', 'middle', 'small']),
  placeholder: PropTypes.string,
  allowClear: PropTypes.bool,
  showSearch: PropTypes.bool,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  style: PropTypes.object,
  className: PropTypes.string,
  dropdownStyle: PropTypes.object,
  dropdownClassName: PropTypes.string,
  theme: PropTypes.oneOf(['light', 'dark']),
  variant: PropTypes.oneOf(['filled', 'outlined']),
  borderless: PropTypes.bool,
  round: PropTypes.bool,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  maxTagCount: PropTypes.number,
  customColors: PropTypes.shape({
    background: PropTypes.string,
    text: PropTypes.string,
    border: PropTypes.string,
    hoverBorder: PropTypes.string,
    focusBorder: PropTypes.string,
    focusShadow: PropTypes.string,
  }),
  onSearch: PropTypes.func,
  filterOption: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  notFoundContent: PropTypes.node,
  suffixIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  clearIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  virtualScroll: PropTypes.bool,
  tooltipTitle: PropTypes.node,
  tooltipPlacement: PropTypes.string,
  fieldNames: PropTypes.object,
  labelInValue: PropTypes.bool,
  optionFilterProp: PropTypes.string,
  optionLabelProp: PropTypes.string,
  defaultActiveFirstOption: PropTypes.bool,
  popupMatchSelectWidth: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  defaultOpen: PropTypes.bool,
  autoClearSearchValue: PropTypes.bool,
  dropdownRender: PropTypes.func,
  onDropdownVisibleChange: PropTypes.func,
  onClear: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onDeselect: PropTypes.func,
  onPopupScroll: PropTypes.func,
  onSelect: PropTypes.func,
};

export default Select;