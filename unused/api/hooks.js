// frontend/src/services/api/hooks.js
import { useState, useCallback } from 'react';
import { ApiStatus } from './constants';

export const useApiCall = (apiFunc) => {
  const [status, setStatus] = useState(ApiStatus.IDLE);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setStatus(ApiStatus.LOADING);
      setError(null);
      const result = await apiFunc(...args);
      setData(result);
      setStatus(ApiStatus.SUCCESS);
      return result;
    } catch (error) {
      setError(error);
      setStatus(ApiStatus.ERROR);
      throw error;
    }
  }, [apiFunc]);

  return {
    execute,
    status,
    data,
    error,
    isLoading: status === ApiStatus.LOADING,
    isSuccess: status === ApiStatus.SUCCESS,
    isError: status === ApiStatus.ERROR
  };
};