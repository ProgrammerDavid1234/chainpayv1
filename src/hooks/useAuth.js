import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,
      login: async () => {},
      logout: async () => {},
      register: async () => {},
      updateWallet: () => {},
    };
  }
  return context;
};

export default useAuth;
