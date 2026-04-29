import {
  register, login, logout, getMe,
  registerWallet, getWalletStatus, getWalletBalance, getGasEstimate,
  getTransactions, getPendingTransactions, getTransaction, verifyTransaction,
  getHealth,
} from '../services/api';

const useApi = () => ({
  register,
  login,
  logout,
  getMe,
  registerWallet,
  getWalletStatus,
  getWalletBalance,
  getGasEstimate,
  getTransactions,
  getPendingTransactions,
  getTransaction,
  verifyTransaction,
  getHealth,
});

export default useApi;