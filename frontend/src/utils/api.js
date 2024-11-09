// frontend/src/utils/api.js
import axios from 'axios';

// Base API URL (update as per your backend)
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create an Axios instance for centralized configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor for setting Authorization header for authenticated requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Adjust based on token storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for handling errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: Redirect to login page or logout the user
      console.warn('Unauthorized. Please log in again.');
      // window.location.href = '/login'; // Redirect if necessary
    }
    return Promise.reject(error.response ? error.response.data : error.message);
  }
);

/**
 * Generic API call function.
 * 
 * @param {string} endpoint - The API endpoint.
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
 * @param {Object} data - Request body for POST/PUT requests.
 * @param {Object} params - Query parameters for GET requests.
 * @returns {Promise} - Axios response promise.
 */
export const apiCall = async (endpoint, method = 'GET', data = {}, params = {}) => {
  try {
    const response = await apiClient({
      url: endpoint,
      method,
      data,
      params
    });
    return response.data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Specific API requests using `apiCall`
// Usage: `login`, `getEmployees`, etc., with clear parameter requirements

export const login = async (employeeId, password) => {
  return apiCall('/auth/login', 'POST', { employeeId, password });
};

export const getEmployees = async (page = 1, limit = 10, filters = {}) => {
  return apiCall('/employees', 'GET', null, { page, limit, ...filters });
};

export const createEmployee = async (employeeData) => {
  return apiCall('/employees', 'POST', employeeData);
};

export const updateEmployee = async (id, employeeData) => {
  return apiCall(`/employees/${id}`, 'PUT', employeeData);
};

export const deleteEmployee = async (id) => {
  return apiCall(`/employees/${id}`, 'DELETE');
};

// Additional API methods (routes, vehicles, etc.) can be added similarly
