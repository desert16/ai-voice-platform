import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sayfa yüklendiğinde token kontrolü
  useEffect(() => {
    const token = localStorage.getItem('vc_token');
    const savedUser = localStorage.getItem('vc_user');
    const savedTenant = localStorage.getItem('vc_tenant');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setTenant(savedTenant ? JSON.parse(savedTenant) : null);
        setIsAuthenticated(true);
      } catch (_) {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { token, user: u, tenant: t } = data;

    localStorage.setItem('vc_token', token);
    localStorage.setItem('vc_user', JSON.stringify(u));
    localStorage.setItem('vc_tenant', JSON.stringify(t));

    setUser(u);
    setTenant(t);
    setIsAuthenticated(true);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('vc_token');
    localStorage.removeItem('vc_user');
    localStorage.removeItem('vc_tenant');
    setIsAuthenticated(false);
    setUser(null);
    setTenant(null);
  };

  if (loading) {
    return React.createElement(
      'div',
      {
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#0A0A1A', color: '#6C63FF', fontSize: '1.2rem'
        }
      },
      'Yükleniyor...'
    );
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { isAuthenticated, user, tenant, login, logout } },
    children
  );
};

export const useAuth = () => useContext(AuthContext);
