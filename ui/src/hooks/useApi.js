import { useState, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const apiCallInProgress = useRef(false);
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/', { replace: true });
      return null;
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleAuthError = (error) => {
    if (
      error.message?.toLowerCase().includes('unauthorized') || 
      error.message?.toLowerCase().includes('expired')
    ) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      navigate('/', { replace: true });
      message.error('Session expired. Please login again.');
    }
  };

  const buildUrl = (endpoint, params = null) => {
    const baseUrl = import.meta.env.VITE_API_URL;
    let url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    if (params) {
      const flatParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        // Skip null, undefined or empty string values
        if (value == null || value === '') return;
        
        // Handle pagination
        if (key === 'pagination' && value) {
          if (value.current) flatParams.append('page', value.current);
          if (value.pageSize) flatParams.append('limit', value.pageSize);
          return;
        }

        // Handle sorting
        if (key === 'sorter' && value) {
          const sortField = value.column?.sortField || value.field;
          if (sortField) {
            flatParams.append('sort_by', sortField);
            flatParams.append('sort_order', value.order === 'ascend' ? 'asc' : 'desc');
          }
          return;
        }

        // Handle filters
        if (key === 'filters' && value) {
          Object.entries(value).forEach(([filterKey, filterValue]) => {
            if (filterValue && filterValue.length > 0) {
              flatParams.append(filterKey, filterValue[0]);
            }
          });
          return;
        }

        // Handle arrays
        if (Array.isArray(value)) {
          if (value.length > 0) {
            flatParams.append(key, value.join(','));
          }
          return;
        }

        // Handle regular params
        flatParams.append(key, value);
      });

      const queryString = flatParams.toString();
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    return url;
  };

  const apiRequest = async (endpoint, method = 'GET', body = null, params = null, additionalHeaders = {}) => {
    if (apiCallInProgress.current) return;

    const headers = { ...getAuthHeaders(), ...additionalHeaders };
    if (!headers) return;

    try {
      setLoading(true);
      apiCallInProgress.current = true;

      const url = buildUrl(endpoint, params);
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error("API Request Error:", error);
      handleAuthError(error);
      message.error(error.message || 'Operation failed');
      throw error;
    } finally {
      apiCallInProgress.current = false;
      setLoading(false);
    }
  };

  return { apiRequest, loading };
};

export default useApi;