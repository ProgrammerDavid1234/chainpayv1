import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  getMe,
  setAuthToken,
} from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('authToken');
        console.log('Restored token:', savedToken);
        
        if (savedToken) {
          setAuthToken(savedToken);
          const res = await getMe();
          console.log('GetMe response:', res.data);
          
          const userData = res.data?.user || res.data;
          
          if (!userData || !userData.id) {
            throw new Error('Invalid user data from server');
          }
          
          setUser({
            userId:        userData.id,
            name:          userData.name,
            email:         userData.email,
            walletAddress: userData.wallet_address || userData.walletAddress || null,
          });
          setToken(savedToken);
        }
      } catch (err) {
        console.error('Restore failed:', err.message);
        setAuthToken(null);
        await AsyncStorage.removeItem('authToken');
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
    
    const newToken = data?.token || data?.accessToken;
    const userData = data?.user || data;
    
    if (!newToken) throw new Error('No token received from server');
    
    await AsyncStorage.setItem('authToken', newToken);
    setAuthToken(newToken);
    setToken(newToken);
    
    setUser({
      userId:        userData?.id             || userData?.userId,
      name:          userData?.name           || name,
      email:         userData?.email          || email,
      walletAddress: userData?.wallet_address || userData?.walletAddress || null,
    });
    
    return { token: newToken, user: userData };
  };

  const login = async ({ email, password }) => {
    const { data } = await loginApi({ email, password });
    
    const newToken = data?.token || data?.accessToken;
    const userData = data?.user || data;
    
    if (!newToken) throw new Error('No token received from server');
    
    await AsyncStorage.setItem('authToken', newToken);
    setAuthToken(newToken);
    setToken(newToken);
    
    setUser({
      userId:        userData?.id             || userData?.userId,
      name:          userData?.name           || userData?.name,
      email:         userData?.email          || userData?.email,
      walletAddress: userData?.wallet_address || userData?.walletAddress || null,
    });
    
    return { token: newToken, user: userData };
  };

  const logout = async () => {
    try { await logoutApi(); } catch (_) {}
    
    await AsyncStorage.removeItem('authToken');
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const updateWallet = (walletAddress) => {
    setUser((prev) => prev ? ({ ...prev, walletAddress }) : null);
  };

  return (
    <AuthContext.Provider value={{
      user, 
      token,
      loading,
      isAuthenticated: !!user,
      register, 
      login, 
      logout, 
      updateWallet,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;