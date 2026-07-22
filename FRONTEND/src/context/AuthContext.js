/**
 * Auth Context
 * Global state management for authentication
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount. Re-validates against the server
  // rather than trusting the cached localStorage user object directly —
  // otherwise a stale copy (e.g. from before an admin demotion) or a
  // manually edited one would let AdminRoute's `user.is_admin` check pass
  // on tampered client-side data alone.
  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      setLoading(false);
      return;
    }

    authAPI.getProfile()
      .then((response) => {
        const freshUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('user');
          localStorage.removeItem('access_token');
        }
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const register = async (username, email, password, fullName, phone) => {
    try {
      setError(null);
      const response = await authAPI.register({
        username,
        email,
        password,
        full_name: fullName,
        phone,
      });

      const { access_token, user: userData } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      window.dispatchEvent(new Event('auth-login'));

      return userData;
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });

      const { access_token, user: userData } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      window.dispatchEvent(new Event('auth-login'));

      return userData;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    // Let CartContext (and anything else session-scoped) know to reset —
    // it has no other way to find out a manual logout just happened.
    window.dispatchEvent(new Event('auth-logout'));
  };

  const updateProfile = async (updates) => {
    try {
      setError(null);
      const response = await authAPI.updateProfile(updates);
      const updatedUser = response.data.user;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return updatedUser;
    } catch (err) {
      const message = err.response?.data?.error || 'Update failed';
      setError(message);
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin: user?.is_admin || false,
      }}
    >
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
