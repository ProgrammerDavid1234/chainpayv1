import {
  register, login, logout, getMe,
  registerWallet, getWalletStatus, getWalletBalance,
  getGasEstimate, getWalletAddress,
  getTransactions, getPendingTransactions, getTransaction,
  verifyTransaction, sendTransaction,
  createNfcRequest, getNfcRequest, confirmNfcPayment, cancelNfcRequest,
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
});

export default useApi;
