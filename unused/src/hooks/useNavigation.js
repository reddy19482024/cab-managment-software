// src/hooks/useNavigation.js
import { useNavigate } from 'react-router-dom';
import { useConfig } from './useConfig';

export const useNavigation = () => {
  const navigate = useNavigate();
  const { pages } = useConfig();

  const navigateToPage = (pageKey, params = {}) => {
    const pageConfig = pages[pageKey];
    if (!pageConfig) {
      console.error(`Page config not found for key: ${pageKey}`);
      return;
    }

    let path = pageConfig.path;
    
    // Replace path parameters
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });

    navigate(path);
  };

  return {
    navigateToPage
  };
};