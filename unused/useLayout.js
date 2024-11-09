import { useState, useEffect } from 'react';
import { useConfig } from '@/contexts/ConfigContext';

export const useLayout = (layoutType) => {
  const { config } = useConfig();
  const [layoutState, setLayoutState] = useState({
    sidebarCollapsed: false,
    // Add more state as needed
  });

  const layoutConfig = config?.layouts?.types?.[layoutType];

  const updateLayoutState = (updates) => {
    setLayoutState(prev => ({ ...prev, ...updates }));
  };

  // Initialize layout state from config
  useEffect(() => {
    if (layoutConfig) {
      setLayoutState(prev => ({
        ...prev,
        sidebarCollapsed: layoutConfig.config?.sidebar?.defaultCollapsed || false,
        // Add more initialization from config
      }));
    }
  }, [layoutConfig]);

  return {
    layoutState,
    updateLayoutState,
    layoutConfig
  };
};