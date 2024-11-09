// frontend/src/services/auth/index.js
import { useConfig } from '@/contexts/ConfigContext';
import { createApiInstance } from '../../api/config';
import { useApiCall } from '../../api/hooks';

export const useAuth = () => {
  const { config } = useConfig();
  const api = createApiInstance(config.api.config);
  const authEndpoints = config.api.endpoints.auth;

  const loginCall = useApiCall(api.post.bind(null, authEndpoints.login.path));
  const logoutCall = useApiCall(api.post.bind(null, authEndpoints.logout.path));

  return {
    login: loginCall.execute,
    logout: logoutCall.execute,
    loginStatus: loginCall.status,
    isLoading: loginCall.isLoading,
    error: loginCall.error
  };
};