import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  getMe,
  setAuthToken,
  getAuthToken,
} from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const savedToken = getAuthToken();
        if (savedToken) {
          const { data } = await getMe();
          setUser({
            userId:        data.user.id,
            name:          data.user.name,
            email:         data.user.email,
            walletAddress: data.user.wallet_address || null,
          });
          setToken(savedToken);
        }
      } catch (_) {
        setAuthToken(null);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const register = async ({ name, email, password }) => {
    const { data } = await registerApi({ name, email, password });
    setAuthToken(data.token);
    setToken(data.token);
    setUser({
      userId:        data.user?.id             || data.userId,
      name:          data.user?.name           || data.name,
      email:         data.user?.email          || data.email,
      walletAddress: data.user?.wallet_address || null,
    });
    return data;
  };

  const login = async ({ email, password }) => {
    const { data } = await loginApi({ email, password });
    setAuthToken(data.token);
    setToken(data.token);
    setUser({
      userId:        data.user?.id             || data.userId,
      name:          data.user?.name           || data.name,
      email:         data.user?.email          || data.email,
      walletAddress: data.user?.wallet_address || data.walletAddress || null,
    });
    return data;
  };

  const logout = async () => {
    try { await logoutApi(); } catch (_) {}
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const updateWallet = (walletAddress) => {
    setUser((prev) => ({ ...prev, walletAddress }));
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!user,
      register, login, logout, updateWallet,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
