import React, { createContext, useContext, useState, useCallback } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    user: null,
    token: localStorage.getItem('token'),
    loading: false
  });

  const login = useCallback(async (credentials) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // You'll need to implement your login API call here
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      setState({
        user: data.user,
        token: data.token,
        loading: false
      });

      message.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      message.error(error.message || 'Login failed');
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setState({
      user: null,
      token: null,
      loading: false
    });
    navigate('/login');
  }, [navigate]);

  const value = {
    ...state,
    login,
    logout,
    isAuthenticated: !!state.token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};