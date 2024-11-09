// frontend/src/builders/ComponentBuilder/hooks.js
export const useComponentHooks = (hookConfig, componentConfig) => {
    const createHook = (type) => {
      switch (type) {
        case 'useForm':
          return {
            onValuesChange: componentConfig.events?.onChange,
            onFinish: componentConfig.events?.onSubmit,
            onReset: componentConfig.events?.onReset,
            onError: componentConfig.events?.onError
          };
        case 'useTable':
          return {
            pagination: {
              onChange: componentConfig.events?.onPageChange
            },
            sorting: componentConfig.events?.onSort,
            filtering: componentConfig.events?.onFilter,
            selection: {
              onChange: componentConfig.events?.onSelect
            }
          };
        case 'useModal':
          return {
            open: componentConfig.events?.onOpen,
            close: componentConfig.events?.onClose,
            confirm: componentConfig.events?.onConfirm,
            cancel: componentConfig.events?.onCancel
          };
        default:
          return {};
      }
    };
  
    return Object.keys(hookConfig.features || {}).reduce((acc, hookType) => ({
      ...acc,
      ...createHook(hookType)
    }), {});
  };