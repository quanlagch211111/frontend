import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setLoading(false);
          return;
        }

        // Set auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get user profile
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/profile`);
        
        if (response.data.success) {
          setCurrentUser(response.data.user);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/login`, {
        email,
        password
      });

      if (response.data.success) {
        setCurrentUser(response.data.user);
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
        toast.success('Login successful!');
        navigate('/dashboard');
        return response.data;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/register`, userData);

      if (response.data.success) {
        setCurrentUser(response.data.user);
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
        toast.success('Registration successful!');
        navigate('/dashboard');
        return response.data;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    toast.info('You have been logged out');
    navigate('/login');
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/forgot-password`, {
        email
      });

      if (response.data.success) {
        toast.success('Password reset instructions sent to your email');
        return response.data;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to process request';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/reset-password`, {
        token,
        newPassword
      });

      if (response.data.success) {
        toast.success('Password reset successful. You can now login.');
        navigate('/login');
        return response.data;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Set up axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 Unauthorized and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }
            
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/refresh-token`, {
              refreshToken
            });
            
            if (response.data.success) {
              localStorage.setItem('accessToken', response.data.accessToken);
              axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
              originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
              
              // Retry the original request
              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            logout();
            throw refreshError;
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate]);

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);