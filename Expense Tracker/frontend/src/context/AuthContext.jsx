import React, { createContext, useState, useMemo, useCallback } from 'react';
import { STORAGE_KEYS, clearUserStorageData } from '../utils/constants';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Lazy initial state retrieval from localStorage avoids synchronous setState inside effect
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN) || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.name === 'Emma Watson' || parsed?.email === 'emma.watson@fintech.io') {
          localStorage.removeItem(STORAGE_KEYS.USER);
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Sync profile from backend on app load if token exists
  React.useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (savedToken && !savedToken.startsWith('demo-jwt-token')) {
        try {
          const profileRes = await authService.getProfile();
          const freshUser = profileRes.user || profileRes.data?.user || profileRes.data;
          if (isMounted && freshUser) {
            setUser(freshUser);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser));
          }
        } catch (err) {
          console.warn('Session verification failed:', err);
          // Token expired or invalid
          if (err.response?.status === 401) {
            clearUserStorageData();
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
            if (isMounted) {
              setToken(null);
              setUser(null);
            }
          }
        }
      } else if (savedToken && savedToken.startsWith('demo-jwt-token')) {
        // Clean out old demo tokens
        clearUserStorageData();
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      }
      if (isMounted) setLoading(false);
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    // Reset previous session's storage cache before establishing new session
    clearUserStorageData();
    const data = await authService.login(credentials);
    const authToken = data.token || data.accessToken || data.data?.token || data.data?.accessToken;
    const userData = data.user || data.data?.user || { email: credentials.email };

    if (authToken) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
      setToken(authToken);
    }

    if (userData) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setUser(userData);
    }

    return data;
  }, []);

  const register = useCallback(async (userData) => {
    // Reset previous session's storage cache before establishing new user profile
    clearUserStorageData();
    const data = await authService.register(userData);
    const authToken = data.token || data.accessToken || data.data?.token || data.data?.accessToken;
    const userPayload = data.user || data.data?.user;

    if (authToken) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
      setToken(authToken);
    }

    if (userPayload) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userPayload));
      setUser(userPayload);
    }

    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Backend logout call error:', err);
    } finally {
      clearUserStorageData();
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      setToken(null);
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, token, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
