// frontend/src/services/theme/index.js
import { useConfig } from '@/contexts/ConfigContext';

export function useTheme() {
  const { config } = useConfig();
  const themeConfig = config?.theme || {};

  // Get theme value with dot notation
  const getValue = (path, defaultValue = undefined) => {
    return path.split('.').reduce((obj, key) => 
      obj ? obj[key] : defaultValue, themeConfig
    );
  };

  // Convert theme values to CSS variables
  const generateCssVariables = (obj, prefix = '') => {
    return Object.entries(obj || {}).reduce((vars, [key, value]) => {
      const varName = prefix ? `--${prefix}-${key}` : `--${key}`;
      
      if (typeof value === 'object' && value !== null) {
        return {
          ...vars,
          ...generateCssVariables(value, prefix ? `${prefix}-${key}` : key)
        };
      }
      
      return {
        ...vars,
        [varName]: value
      };
    }, {});
  };

  // Generate Ant Design theme config
  const getAntdTheme = () => {
    const colors = getValue('colors', {});
    const typography = getValue('typography', {});
    const spacing = getValue('spacing', {});

    return {
      token: {
        // Colors
        colorPrimary: colors.primary,
        colorSuccess: colors.success,
        colorWarning: colors.warning,
        colorError: colors.error,
        colorInfo: colors.info,
        colorTextBase: colors.text?.primary,
        colorBgBase: colors.background?.default,

        // Typography
        fontFamily: typography.fontFamily,
        fontSize: parseInt(typography.scale?.md || '14'),
        fontWeightLight: typography.weight?.light,
        fontWeightNormal: typography.weight?.normal,
        fontWeightBold: typography.weight?.bold,

        // Spacing
        marginXS: spacing.xs,
        marginSM: spacing.sm,
        margin: spacing.md,
        marginMD: spacing.md,
        marginLG: spacing.lg,
        marginXL: spacing.xl,

        // Border radius
        borderRadius: spacing.borderRadius?.base,
        borderRadiusLG: spacing.borderRadius?.lg,
        borderRadiusSM: spacing.borderRadius?.sm,

        // Layout
        screenXS: spacing.layout?.screenXS,
        screenSM: spacing.layout?.screenSM,
        screenMD: spacing.layout?.screenMD,
        screenLG: spacing.layout?.screenLG,
        screenXL: spacing.layout?.screenXL
      },
      components: {
        Button: {
          borderRadius: spacing.borderRadius?.base,
          paddingContentHorizontal: spacing.padding?.md,
          controlHeight: spacing.height?.base,
          fontSize: typography.scale?.md
        },
        Card: {
          padding: spacing.padding?.lg,
          borderRadius: spacing.borderRadius?.lg
        },
        Table: {
          borderRadius: spacing.borderRadius?.base,
          padding: spacing.padding?.sm,
          headerBg: colors.background?.paper
        },
        Layout: {
          headerHeight: spacing.layout?.headerHeight,
          headerPadding: spacing.layout?.headerPadding,
          sidebarWidth: spacing.layout?.sidebarWidth
        }
      }
    };
  };

  // Initialize theme
  const initializeTheme = () => {
    // Generate CSS variables
    const cssVars = generateCssVariables(themeConfig);
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  };

  // Utility functions for components
  const getColor = (path) => getValue(`colors.${path}`);
  const getSpacing = (key) => getValue(`spacing.${key}`);
  const getTypography = (key) => getValue(`typography.${key}`);
  const getComponentTheme = (componentName) => getValue(`components.${componentName}`);

  return {
    // Theme getters
    getValue,
    getColor,
    getSpacing,
    getTypography,
    getComponentTheme,
    
    // Theme setup
    initializeTheme,
    getAntdTheme,
    
    // Direct access to theme sections
    colors: themeConfig.colors,
    typography: themeConfig.typography,
    spacing: themeConfig.spacing,
    components: themeConfig.components,

    // CSS variable utilities
    generateCssVariables
  };
}