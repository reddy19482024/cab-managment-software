// frontend/src/builders/ComponentBuilder/processors.js
export const processProps = (props, context) => {
  const { features, hooks, variant } = context;

  // Process feature-based props
  const featureProps = Object.entries(features || {}).reduce((acc, [key, value]) => {
    switch (key) {
      case 'selection':
        if (value.enabled) {
          acc.rowSelection = {
            type: value.type,
            ...hooks?.selection
          };
        }
        break;
      case 'pagination':
        if (value.enabled) {
          acc.pagination = {
            ...value,
            ...hooks?.pagination
          };
        }
        break;
      case 'sorting':
        if (value.enabled) {
          acc.sortable = true;
          if (hooks?.sorting) {
            acc.onChange = (...args) => hooks.sorting(...args);
          }
        }
        break;
      // Add more feature processors
    }
    return acc;
  }, {});

  // Process variant-specific props
  const variantProps = variant ? getVariantProps(variant) : {};

  return {
    ...props,
    ...featureProps,
    ...variantProps
  };
};