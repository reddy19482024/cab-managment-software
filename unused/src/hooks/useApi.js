// src/hooks/useApi.js
import { useContext, useMemo, useCallback } from 'react';
import { useConfig } from './useConfig';

export const useApi = () => {
  const { api: apiConfig } = useConfig();

  // Process API endpoint
  const processEndpoint = useCallback((endpoint, params = {}) => {
    const config = apiConfig[endpoint];
    if (!config) {
      throw new Error(`API endpoint "${endpoint}" not found in configuration`);
    }

    // Replace URL parameters
    let url = config.url;
    const urlParams = url.match(/:([\w]+)/g) || [];
    urlParams.forEach(param => {
      const paramName = param.substring(1);
      if (!params[paramName]) {
        throw new Error(`Missing required URL parameter: ${paramName}`);
      }
      url = url.replace(param, params[paramName]);
      delete params[paramName];
    });

    return {
      url,
      method: config.method,
      ...config,
      params: config.method === 'GET' ? params : undefined,
      data: config.method !== 'GET' ? params : undefined
    };
  }, [apiConfig]);

  // Table data fetching
  const useTable = useCallback((endpoint) => {
    const fetchData = async (params = {}) => {
      const config = processEndpoint(endpoint, params);
      const response = await request(config);

      return {
        data: response.data,
        pagination: response.pagination,
        success: true
      };
    };

    return { fetchData };
  }, [processEndpoint]);

  // Form submission
  const useForm = useCallback((endpoint) => {
    const submit = async (data) => {
      const config = processEndpoint(endpoint, data);
      return request(config);
    };

    return { submit };
  }, [processEndpoint]);

  // Basic API methods
  const get = useCallback(async (endpoint, params) => {
    const config = processEndpoint(endpoint, params);
    return request({ ...config, method: 'GET' });
  }, [processEndpoint]);

  const post = useCallback(async (endpoint, data) => {
    const config = processEndpoint(endpoint, data);
    return request({ ...config, method: 'POST' });
  }, [processEndpoint]);

  const put = useCallback(async (endpoint, data) => {
    const config = processEndpoint(endpoint, data);
    return request({ ...config, method: 'PUT' });
  }, [processEndpoint]);

  const remove = useCallback(async (endpoint, params) => {
    const config = processEndpoint(endpoint, params);
    return request({ ...config, method: 'DELETE' });
  }, [processEndpoint]);

  return {
    get,
    post,
    put,
    delete: remove,
    useTable,
    useForm
  };
};

// Example usage in a component:
/*
const UserList = () => {
  const { useTable } = useApi();
  
  const { fetchData } = useTable('users.list');

  return (
    <Table
      columns={columns}
      request={fetchData}
    />
  );
};

const UserForm = () => {
  const { useForm } = useApi();
  
  const { submit } = useForm('users.create');

  const onFinish = async (values) => {
    await submit(values);
  };

  return (
    <Form onFinish={onFinish}>
      ...
    </Form>
  );
};
*/