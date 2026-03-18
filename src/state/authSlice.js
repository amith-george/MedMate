// src/state/authSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../api/axiosConfig'; // This is your shared axios instance

// Async Thunk for user registration
export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ name, password, idToken }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/users/register', { name, password, idToken });
      return data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: error.message });
      }
    }
  }
);

// Async Thunk for user login
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ phone, password }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/users/login', { phone, password });
      return data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: error.message });
      }
    }
  }
);

// Async Thunk for updating user profile (general info)
export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async (userData, { rejectWithValue }) => {
    try {
      // Makes a PUT request to /users/profile using the protected apiClient
      const { data } = await apiClient.put('/users/profile', userData);
      return data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: error.message });
      }
    }
  }
);

// --- NEW: Async Thunk for updating preferences specifically ---
export const updatePreferences = createAsyncThunk(
  'auth/updatePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      // We reuse the existing /users/profile endpoint but only send preferences
      const { data } = await apiClient.put('/users/profile', { preferences });
      return data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: error.message });
      }
    }
  }
);

// Async Thunk for changing password (logged in)
export const changeUserPassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put('/users/change-password', { currentPassword, newPassword });
      return data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: error.message });
      }
    }
  }
);

const initialState = {
  user: null,
  token: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      
      // Remove the token from Axios headers on logout
      delete apiClient.defaults.headers.common['Authorization'];
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Login Handlers ---
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.token = action.payload.token;

        // Set token in Axios headers
        if (action.payload.token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Login failed';
      })

      // --- Register Handlers ---
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.token = action.payload.token;

        // Set token in Axios headers
        if (action.payload.token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Registration failed';
      })

      // --- Update User Handlers ---
      .addCase(updateUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        // Optionally update token if your backend rotates it on update
        if (action.payload.token) {
          state.token = action.payload.token;
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Update failed';
      })

      // --- Update Preferences Handlers (NEW) ---
      .addCase(updatePreferences.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // The backend returns the full updated user object, so we update the state
        state.user = action.payload;
      })
      .addCase(updatePreferences.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to update preferences';
      })

      // --- Change Password Handlers ---
      .addCase(changeUserPassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(changeUserPassword.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(changeUserPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Password change failed';
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;