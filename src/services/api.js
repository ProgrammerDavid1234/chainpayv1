import axios from 'axios';

// Genymotion uses 10.0.3.2, Android Studio uses 10.0.2.2
// Real device: use your PC IP e.g. http://192.168.x.x:4000/api/v1
// const BASE_URL = 'http://10.0.3.2:4000/api/v1';
const BASE_URL = 'https://chainpaybackend.onrender.com/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
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
export const register    = (data)   => api.post('/auth/register', data);
export const login       = (data)   => api.post('/auth/login', data);
export const logout      = ()       => api.post('/auth/logout');
export const getMe       = ()       => api.get('/auth/me');

// ── Wallet ────────────────────────────────────────────────────────────────────
export const getWalletNonce    = ()            => api.get('/wallet/nonce');
export const registerWallet    = (data)        => api.post('/wallet', data);
export const getWalletStatus   = ()            => api.get('/wallet/status');
export const getWalletBalance  = ()            => api.get('/wallet/balance');
export const getGasEstimate    = (to, amount) => api.get(`/wallet/gas-estimate?to=${to}&amount=${amount}`);

// ── Transactions ──────────────────────────────────────────────────────────────
export const getTransactions       = (filter = 'all', page = 1) => api.get(`/transactions?filter=${filter}&page=${page}`);
export const getPendingTransactions = ()         => api.get('/transactions/pending');
export const getTransaction        = (txHash)   => api.get(`/transactions/${txHash}`);
export const verifyTransaction     = (txHash)   => api.get(`/transactions/${txHash}/verify`);

// ── Health ────────────────────────────────────────────────────────────────────
export const getHealth = () => api.get('/health');

export default api;