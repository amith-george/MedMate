import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../api/axiosConfig'; // Ensure this path is correct

// Async Thunk to fetch user's medicines
export const fetchMedicines = createAsyncThunk(
  'medicines/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue({ message: 'User is not authenticated.' });
      }
      const config = { headers: { Authorization: `Bearer ${auth.token}` } };
      const { data } = await apiClient.get('/medicine/list', config);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue({ message });
    }
  }
);

// Async Thunk to add a new medicine
export const addMedicine = createAsyncThunk(
  'medicines/add',
  async (medicineData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      };
      const { data } = await apiClient.post('/medicine/create', medicineData, config);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue({ message });
    }
  }
);

// --- NEW ---
// Async Thunk to delete a medicine by its ID
export const deleteMedicine = createAsyncThunk(
  'medicines/delete',
  async (medicineId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = { headers: { Authorization: `Bearer ${auth.token}` } };
      await apiClient.delete(`/medicine/delete/${medicineId}`, config);
      // Return the ID on success so we can remove it from the state
      return medicineId;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return rejectWithValue({ message });
    }
  }
);


const initialState = {
  medicines: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const medicineSlice = createSlice({
  name: 'medicines',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Cases for adding a medicine
      .addCase(addMedicine.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(addMedicine.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.medicines.push(action.payload);
      })
      .addCase(addMedicine.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
      })
      // Cases for fetching medicines
      .addCase(fetchMedicines.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMedicines.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.medicines = action.payload;
      })
      .addCase(fetchMedicines.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
      })
      // --- NEW ---
      // Cases for deleting a medicine
      .addCase(deleteMedicine.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteMedicine.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Filter out the deleted medicine from the state array
        state.medicines = state.medicines.filter(
          (med) => med._id !== action.payload
        );
      })
      .addCase(deleteMedicine.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
      });
  },
});

export default medicineSlice.reducer;