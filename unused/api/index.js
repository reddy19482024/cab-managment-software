// frontend/src/services/api/index.js
import { useConfig } from '@/contexts/ConfigContext';
import { createApiInstance } from './config';

export function useApi() {
  const { config } = useConfig();
  const api = createApiInstance(config.api.config);

  // Creates API methods from endpoints config
  const createApiMethods = (endpointsConfig = {}) => {
    return Object.entries(endpointsConfig).reduce((services, [serviceName, endpoints]) => {
      services[serviceName] = Object.entries(endpoints).reduce((methods, [methodName, endpoint]) => {
        methods[methodName] = async (params = {}, data = null) => {
          try {
            let url = endpoint.path;
            
            // Replace path parameters (e.g., /employees/:id -> /employees/123)
            if (params.path) {
              Object.entries(params.path).forEach(([key, value]) => {
                url = url.replace(`:${key}`, value);
              });
            }

            return await api({
              method: endpoint.method.toLowerCase(),
              url,
              ...(data && { data }),
              ...(params.query && { params: params.query })
            });
          } catch (error) {
            console.error(`API Error in ${serviceName}.${methodName}:`, error);
            throw error;
          }
        };
        return methods;
      }, {});

      return services;
    }, {});
  };

  return createApiMethods(config.api.endpoints);
}