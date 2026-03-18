import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '../api/axiosConfig';

// 1. Fetch Caregivers
// Backend Route: GET /caregiver/list
export const fetchCaregivers = createAsyncThunk(
  'caregiver/fetchCaregivers',
  async (_, { rejectWithValue }) => {
    try {
      // FIX: Changed from '/caregivers' to '/caregiver/list'
      const response = await axios.get('/caregiver/list'); 
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch caregivers');
    }
  }
);

// 2. Add Caregiver
// Backend Route: POST /caregiver/add
export const addCaregiver = createAsyncThunk(
  'caregiver/addCaregiver',
  async (caregiverData, { rejectWithValue }) => {
    try {
      // FIX: Changed from '/caregivers' to '/caregiver/add'
      const response = await axios.post('/caregiver/add', caregiverData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add caregiver');
    }
  }
);

// 3. Remove Caregiver
// Backend Route: DELETE /caregiver/:id
export const removeCaregiver = createAsyncThunk(
  'caregiver/removeCaregiver',
  async (id, { rejectWithValue }) => {
    try {
      // FIX: Changed from '/caregivers/${id}' to '/caregiver/${id}'
      await axios.delete(`/caregiver/${id}`);
      return id; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove caregiver');
    }
  }
);

const caregiverSlice = createSlice({
  name: 'caregivers',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCaregivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCaregivers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCaregivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add
      .addCase(addCaregiver.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(addCaregiver.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Remove
      .addCase(removeCaregiver.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c._id !== action.payload);
      });
  },
});

export const { clearError } = caregiverSlice.actions;
export default caregiverSlice.reducer;