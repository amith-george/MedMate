import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../api/axiosConfig';
// FIX 2: Import the delete action from medicineSlice
import { deleteMedicine } from './medicineSlice';

// Async Thunk to create a new schedule
export const createSchedule = createAsyncThunk(
  'schedule/create',
  async (scheduleData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
      };
      const { data } = await apiClient.post('/schedule/add', scheduleData, config);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue({ message });
    }
  }
);

export const deleteSchedule = createAsyncThunk(
  'schedule/delete',
  async (scheduleId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      };
      await apiClient.delete(`/schedule/${scheduleId}`, config);
      return scheduleId; 
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue({ message });
    }
  }
);

export const fetchTodaysReminders = createAsyncThunk(
  'schedule/fetchTodays',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      };
      const { data } = await apiClient.get('/schedule/today', config);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue({ message });
    }
  }
);

export const fetchAllSchedules = createAsyncThunk(
  'schedule/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = { headers: { Authorization: `Bearer ${auth.token}` } };
      const { data } = await apiClient.get('/schedule/list', config);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue({ message });
    }
  }
);

export const fetchScheduleForMedicine = createAsyncThunk(
  'schedule/fetchForMedicine',
  async (medicineId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = { headers: { Authorization: `Bearer ${auth.token}` } };
      const { data } = await apiClient.get(`/schedule/medicine/${medicineId}`, config);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue({ message });
    }
  }
);

const initialState = {
  reminders: [],
  schedules: [],
  schedulesByMedicine: {}, 
  status: 'idle',
  error: null,
};

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // --- Standard Schedule Cases ---
      .addCase(fetchTodaysReminders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reminders = action.payload;
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.schedules.push(action.payload);
      })
      .addCase(deleteSchedule.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.schedules = state.schedules.filter(
          (schedule) => schedule._id !== action.payload
        );
      })
      .addCase(fetchAllSchedules.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.schedules = action.payload;
      })
      .addCase(fetchScheduleForMedicine.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload) {
          state.schedulesByMedicine[action.payload.medicine._id] = action.payload;
        }
      })
      
      // --- FIX 2: Handle MEDICINE deletion ---
      // When a medicine is deleted, we must remove its schedule from the state immediately
      .addCase(deleteMedicine.fulfilled, (state, action) => {
        const deletedMedicineId = action.payload;
        // Remove from the main schedules list
        state.schedules = state.schedules.filter(schedule => {
          // Handle populated medicine object OR raw ID string
          const medId = schedule.medicine?._id || schedule.medicine;
          return medId !== deletedMedicineId;
        });
        
        // Remove from the specific map as well
        if (state.schedulesByMedicine[deletedMedicineId]) {
            delete state.schedulesByMedicine[deletedMedicineId];
        }
      })

      // Add loading/error handlers for standard cases
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => { state.status = 'loading'; }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload?.message;
        }
      );
  },
});

export default scheduleSlice.reducer;