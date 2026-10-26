import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../services/api.js';
import { AuthContext } from './authContext.js';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      return;
    }

    apiFetch('/auth/me')
      .then((data) => {
        if (isMounted) {
          setUser(data.user);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Sesión no válida o expirada:', err.message);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!data?.token || !data?.user) {
        throw new Error('Respuesta de autenticación incompleta');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (err) {
      const message = err.message || 'Error al iniciar sesión';
      setError(message);
      throw err;
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
