// src/api/axiosConfig.js
import axios from 'axios';

// Hostel IP address: http://192.168.5.67:4000
// Home IP Address: http://192.168.31.76:4000
// Aadil IP Address: http://10.78.94.121:4000
// Free public wifi IP: http://10.162.198.121:4000
// Toric Software IP: http://192.168.200.11:4000

// IMPORTANT: Replace with your computer's local IP address
export const BASE_URL = 'http://192.168.31.76:4000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- NEW: Store Injection Logic ---
let store;

// This function will be called by store.js to give us access to the Redux state
export const injectStore = (_store) => {
  store = _store;
};

// --- NEW: Request Interceptor ---
// This runs before EVERY request sent by apiClient
apiClient.interceptors.request.use(
  async (config) => {
    if (store) {
      // 1. Get the current state from Redux
      const state = store.getState();
      
      // 2. Extract the token
      const token = state.auth.token;

      // 3. If token exists, attach it to headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;