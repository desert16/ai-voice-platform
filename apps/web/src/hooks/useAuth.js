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

    if (token && token !== 'demo-token' && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const parsedTenant = savedTenant ? JSON.parse(savedTenant) : (parsedUser?.tenant || null);
        setUser(parsedUser);
        setTenant(parsedTenant);
        setIsAuthenticated(true);
      } catch (_) {
        localStorage.clear();
      }
    } else if (token === 'demo-token') {
      localStorage.clear();
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const payload = response.data?.data || response.data;
    
    // Backend returns { user, tokens: { accessToken, refreshToken } }
    const accessToken = payload?.tokens?.accessToken || payload?.accessToken || payload?.token;
    const userData = payload?.user;
    const tenantData = userData?.tenant || payload?.tenant;

    if (!accessToken) {
      throw new Error('Geçersiz sunucu yanıtı: Token bulunamadı');
    }

    localStorage.setItem('vc_token', accessToken);
    localStorage.setItem('vc_user', JSON.stringify(userData));
    if (tenantData) {
      localStorage.setItem('vc_tenant', JSON.stringify(tenantData));
    }

    setUser(userData);
    setTenant(tenantData);
    setIsAuthenticated(true);
    return payload;
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


