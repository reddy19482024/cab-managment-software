// src/core/services/api.js
import axios from 'axios';
import { message } from 'antd';

class ApiService {
  constructor(config) {
    this.config = config;
    this.client = this.createClient();
    this.requestInterceptor();
    this.responseInterceptor();
  }

  createClient() {
    return axios.create({
      baseURL: this.config.baseURL || '/api',
      timeout: this.config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers
      }
    });
  }

  requestInterceptor() {
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if exists
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Handle query params
        if (config.params) {
          // Convert page/limit for backend
          if (config.params.current) {
            config.params.page = config.params.current;
            delete config.params.current;
          }
          if (config.params.pageSize) {
            config.params.limit = config.params.pageSize;
            delete config.params.pageSize;
          }

          // Remove empty params
          Object.keys(config.params).forEach(key => {
            if (config.params[key] === undefined || config.params[key] === '') {
              delete config.params[key];
            }
          });
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  responseInterceptor() {
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Handle different error types
        if (error.response) {
          switch (error.response.status) {
            case 401:
              // Handle unauthorized
              localStorage.removeItem('token');
              window.location.href = '/login';
              break;
            case 403:
              message.error('Access denied');
              break;
            case 404:
              message.error('Resource not found');
              break;
            case 422:
              // Validation errors
              const errors = error.response.data.errors;
              if (errors) {
                Object.values(errors).forEach(err => {
                  message.error(err[0]);
                });
              }
              break;
            default:
              message.error(error.response.data.message || 'Something went wrong');
          }
        } else if (error.request) {
          message.error('Network error. Please try again.');
        } else {
          message.error('An error occurred. Please try again.');
        }

        return Promise.reject(error);
      }
    );
  }

  // Process API response
  processResponse(response) {
    return {
      data: response.data.data || response.data,
      pagination: response.data.pagination && {
        total: response.data.pagination.total,
        current: response.data.pagination.page,
        pageSize: response.data.pagination.limit
      }
    };
  }

  // API Methods
  async request(config) {
    try {
      const response = await this.client.request(config);
      return this.processResponse(response);
    } catch (error) {
      throw error;
    }
  }

  async get(url, params) {
    return this.request({ method: 'GET', url, params });
  }

  async post(url, data) {
    return this.request({ method: 'POST', url, data });
  }

  async put(url, data) {
    return this.request({ method: 'PUT', url, data });
  }

  async delete(url) {
    return this.request({ method: 'DELETE', url });
  }
}

export default ApiService;