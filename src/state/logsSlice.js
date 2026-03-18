import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../api/axiosConfig';

// Fetches recent logs for the main HistoryScreen
export const fetchRecentLogs = createAsyncThunk(
  'logs/fetchRecent',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) return rejectWithValue({ message: 'User is not authenticated.' });
      const config = { headers: { Authorization: `Bearer ${auth.token}` } };
      const { data } = await apiClient.get('/logs/recent', config);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue({ message });
    }
  }
);

// Fetches all logs for one specific medicine
export const fetchLogsForMedicine = createAsyncThunk(
  'logs/fetchForMedicine',
  async (medicineId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) return rejectWithValue({ message: 'User is not authenticated.' });
      const config = { headers: { Authorization: `Bearer ${auth.token}` } };
      const { data } = await apiClient.get(`/logs/${medicineId}`, config);
      return { medicineId, logs: data };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue({ message });
    }
  }
);

// --- NEW: Record a Dose (Taken/Missed) ---
export const recordDose = createAsyncThunk(
  'logs/record',
  async ({ medicineId, scheduledTime, status, notes }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      };
      
      const body = { medicineId, scheduledTime, status, notes };
      
      const { data } = await apiClient.post('/logs/record', body, config);
      return data; // Returns { message, log, updatedStock }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue({ message });
    }
  }
);

const initialState = {
  recentLogs: [],
  logsByMedicine: {},
  status: 'idle',
  error: null,
};

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchRecentLogs
      .addCase(fetchRecentLogs.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchRecentLogs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.recentLogs = action.payload;
      })
      .addCase(fetchRecentLogs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
      })
      
      // fetchLogsForMedicine
      .addCase(fetchLogsForMedicine.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchLogsForMedicine.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.logsByMedicine[action.payload.medicineId] = action.payload.logs;
      })
      .addCase(fetchLogsForMedicine.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
      })

      // --- NEW: recordDose ---
      .addCase(recordDose.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(recordDose.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Optimistically add the new log to the top of recentLogs so the UI updates instantly
        if (action.payload.log) {
          state.recentLogs.unshift(action.payload.log);
        }
      })
      .addCase(recordDose.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
      });
  },
});

export default logsSlice.reducer;