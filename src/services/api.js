import axios from 'axios';

const BASE_URL = 'https://chainpaybackend.onrender.com/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = () => authToken;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const register = (data) => api.post('/auth/register', data);
export const login    = (data) => api.post('/auth/login', data);
export const logout   = ()     => api.post('/auth/logout');
export const getMe    = ()     => api.get('/auth/me');

// ── Wallet ────────────────────────────────────────────────────────────────────
export const getWalletNonce   = ()           => api.get('/wallet/nonce');
export const registerWallet   = (data)       => api.post('/wallet', data);
export const getWalletStatus  = ()           => api.get('/wallet/status');
export const getWalletBalance = ()           => api.get('/wallet/balance');
export const getGasEstimate   = (to, amount) => api.get(`/wallet/gas-estimate?to=${to}&amount=${amount}`);
export const getWalletAddress = ()           => api.get('/wallet/status');

// ── Transactions ──────────────────────────────────────────────────────────────
export const getTransactions        = (filter = 'all', page = 1, limit = 20) => api.get(`/transactions?filter=${filter}&page=${page}&limit=${limit}`);
export const getPendingTransactions = ()       => api.get('/transactions/pending');
export const getTransaction         = (txHash) => api.get(`/transactions/${txHash}`);
export const verifyTransaction      = (txHash) => api.get(`/transactions/${txHash}/verify`);
export const sendTransaction        = (data)   => api.post('/transactions/send', data);

// ── NFC Payments ──────────────────────────────────────────────────────────────
export const createNfcRequest  = (amountEth) => api.post('/nfc/request', { amountEth });
export const getNfcRequest     = (requestId) => api.get(`/nfc/request/${requestId}`);
export const confirmNfcPayment = (data)      => api.post('/nfc/confirm', data);
export const cancelNfcRequest  = (requestId) => api.delete(`/nfc/request/${requestId}`);

// ── Health ────────────────────────────────────────────────────────────────────
export const getHealth = () => api.get('/health');

export default api;