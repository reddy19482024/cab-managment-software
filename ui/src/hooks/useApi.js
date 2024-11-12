// hooks/useApi.js
import { useState, useRef } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const apiCallInProgress = useRef(false); // Prevent multiple calls
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

  const apiRequest = async (endpoint, method = 'GET', body = null, additionalHeaders = {}) => {
    if (apiCallInProgress.current) return; // Prevent multiple calls

    const baseUrl = import.meta.env.VITE_API_URL;
    const url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    const headers = { ...getAuthHeaders(), ...additionalHeaders };

    if (!headers) return;

    try {
      setLoading(true);
      apiCallInProgress.current = true;

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
    } finally {
      apiCallInProgress.current = false;
      setLoading(false);
    }
  };

  return { apiRequest, loading };
};

export default useApi;
