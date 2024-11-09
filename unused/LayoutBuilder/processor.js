// frontend/src/builders/LayoutBuilder/processors.js
import { get } from 'lodash';

export const processStyles = (styles = {}, theme) => {
  const processValue = (value) => {
    if (typeof value !== 'string') return value;
    
    if (value.includes('${theme.')) {
      const themeKey = value.match(/\${(.*?)}/)[1];
      return get(theme, themeKey.replace('theme.', ''));
    }

    if (value.includes('${app.')) {
      const appKey = value.match(/\${(.*?)}/)[1];
      return get(useConfig().app, appKey.replace('app.', ''));
    }

    if (value.includes('${currentYear}')) {
      return new Date().getFullYear();
    }

    return value;
  };

  return Object.entries(styles).reduce((acc, [key, value]) => {
    if (typeof value === 'object' && value !== null) {
      acc[key] = processStyles(value, theme);
    } else {
      acc[key] = processValue(value);
    }
    return acc;
  }, {});
};

export const processConfig = (config = {}, theme) => {
  return Object.entries(config).reduce((acc, [key, value]) => {
    if (typeof value === 'object' && value !== null) {
      acc[key] = processConfig(value, theme);
    } else if (typeof value === 'string' && value.includes('${')) {
      acc[key] = processStyles({ value }, theme).value;
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
};
