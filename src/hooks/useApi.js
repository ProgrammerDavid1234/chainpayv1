import { useCallback } from 'react';
import useAuth from './useAuth';
import {
  getMe,
  getWalletStatus,
  getWalletBalance,
  getGasEstimate,
  getWalletAddress,
  getTransactions,
  getPendingTransactions,
  getTransaction,
  verifyTransaction,
  sendTransaction,
  createNfcRequest,
  getNfcRequest,
  confirmNfcPayment,
  cancelNfcRequest,
  getHealth,
  setAuthToken,
} from '../services/api';

const useApi = () => {
  const { token } = useAuth();

  const withAuth = useCallback((apiFunc) => {
    return async (...args) => {
      if (token) {
        setAuthToken(token);
      }
      return apiFunc(...args);
    };
  }, [token]);

  return {
    getMe: withAuth(getMe),
    getWalletStatus: withAuth(getWalletStatus),
    getWalletBalance: withAuth(getWalletBalance),
    getGasEstimate: withAuth(getGasEstimate),
    getWalletAddress: withAuth(getWalletAddress),
    getTransactions: withAuth(getTransactions),
    getPendingTransactions: withAuth(getPendingTransactions),
    getTransaction: withAuth(getTransaction),
    verifyTransaction: withAuth(verifyTransaction),
    sendTransaction: withAuth(sendTransaction),
    createNfcRequest: withAuth(createNfcRequest),
    getNfcRequest: withAuth(getNfcRequest),
    confirmNfcPayment: withAuth(confirmNfcPayment),
    cancelNfcRequest: withAuth(cancelNfcRequest),
    getHealth,
  };
};

export default useApi;