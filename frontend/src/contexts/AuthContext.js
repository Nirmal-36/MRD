import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);
const GRACE_PERIOD_MS = 5 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
  const sessionToken = sessionStorage.getItem('token');
  const sessionUser = sessionStorage.getItem('user');

  if (sessionToken && sessionUser) {
    setToken(sessionToken);
    setUser(JSON.parse(sessionUser));
    setLoading(false);
    return;
  }

  // Grace restore
  const graceRaw = localStorage.getItem('auth_grace');
  if (graceRaw) {
    try {
      const { token, user, timestamp } = JSON.parse(graceRaw);
      const isValid = Date.now() - timestamp <= GRACE_PERIOD_MS;

      if (isValid) {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);
      } else {
        localStorage.removeItem('auth_grace');
      }
    } catch {
      localStorage.removeItem('auth_grace');
    }
  }

  setLoading(false);
}, []);


  // Login function
  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      const { token: authToken, user: userData } = response.data;
      const now = Date.now();

      sessionStorage.setItem('token', authToken);
      sessionStorage.setItem('user', JSON.stringify(userData));

      localStorage.setItem(
        'auth_grace',
        JSON.stringify({
          token: authToken,
          user: userData,
          timestamp: now,
        })
      );

      setToken(authToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
          console.error('Login error:', error);
      }
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed. Please check your credentials.',
      };
    }
  };

  // Register function (for medical staff)
  const register = async (data) => {
    try {
      const response = await apiService.register(data);
      return { success: true, data: response.data };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Registration error:', error);
      }
      return {
        success: false,
        error: error.response?.data || 'Registration failed.',
      };
    }
  };

  // Patient register function (for students/employees)
  const patientRegister = async (data) => {
    try {
      const response = await apiService.patientRegister(data);
      const { token: authToken, user: userData } = response.data;
      const now = Date.now();

      sessionStorage.setItem('token', authToken);
      sessionStorage.setItem('user', JSON.stringify(userData));

      localStorage.setItem(
        'auth_grace',
        JSON.stringify({
          token: authToken,
          user: userData,
          timestamp: now,
        })
      );

      setToken(authToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      if(process.env.NODE_ENV === 'development') {
        console.error('Patient registration error:', error);
      }
      return {
        success: false,
        error: error.response?.data || 'Registration failed.',
      };
    }
  };

  // Logout function
  const logout = () => {

    sessionStorage.clear();
    localStorage.removeItem('auth_grace');
    setToken(null);
    setUser(null);
    window.location.replace('/login');
    
  };


  // Update user function
  const updateUser = (userData) => {
    
  sessionStorage.setItem('user', JSON.stringify(userData));

    setUser(userData);
  };

  // Forgot password function - Verify user and send OTP
  const forgotPassword = async (identifier) => {
    try {
      const response = await apiService.forgotPassword({ identifier });
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      if(process.env.NODE_ENV === 'development') {
        console.error('Forgot password error:', error);
      }
      return {
        success: false,
        error: error.response?.data?.identifier?.[0] || error.response?.data?.error || 'User not found.',
      };
    }
  };

  // Verify OTP function
  const verifyOTP = async (email, otp) => {
    try {
      const response = await apiService.verifyOTP({ email, otp });
      return { 
        success: true, 
        message: response.data.message 
      };
    } catch (error) {
      if(process.env.NODE_ENV === 'development') {
        console.error('OTP verification error:', error);
      }
      return {
        success: false,
        error: error.response?.data?.error || 'Invalid or expired OTP.',
      };
    }
  };

  // Reset password function - Set new password with OTP
  const resetPassword = async (email, otp, newPassword, confirmPassword) => {
    try {
      const response = await apiService.resetPassword({ 
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword 
      });
      return { 
        success: true, 
        message: response.data.message 
      };
    } catch (error) {
      if(process.env.NODE_ENV === 'development') {
        console.error('Reset password error:', error);
      }
      const errorMsg = error.response?.data?.error
        || error.response?.data?.new_password?.[0]
        || error.response?.data?.non_field_errors?.[0]
        || 'Failed to reset password. Please try again.';
      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  // Check if user has specific role
  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.user_type);
    }
    return user.user_type === roles;
  };

  // Check if user is medical staff
  const isMedicalStaff = () => {
    return hasRole(['admin', 'doctor', 'nurse', 'pharmacist']);
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    patientRegister,
    logout,
    updateUser,
    forgotPassword,
    verifyOTP,
    resetPassword,
    hasRole,
    isMedicalStaff,
    isAdmin,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
