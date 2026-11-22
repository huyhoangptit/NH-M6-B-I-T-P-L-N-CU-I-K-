import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('cineticket_token');
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
    } catch {
      localStorage.removeItem('cineticket_token');
      setUser(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('cineticket_token', response.data.data.token);
    setUser(response.data.data.user);
    return response.data.data.user;
  };

  const register = async (formData) => {
    const response = await api.post('/auth/register', formData);
    localStorage.setItem('cineticket_token', response.data.data.token);
    setUser(response.data.data.user);
    return response.data.data.user;
  };

  const logout = () => {
    localStorage.removeItem('cineticket_token');
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshUser }), [user, loading, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được dùng bên trong AuthProvider');
  return context;
}
