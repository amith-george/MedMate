// src/state/store.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import authReducer from './authSlice';
import caregiverReducer from './caregiverSlice';
import logsReducer from './logsSlice';
import medicineReducer from './medicineSlice';
import scheduleReducer from './scheduleSlice';

// --- 1. Import the injectStore function ---
import { injectStore } from '../api/axiosConfig';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  schedule: scheduleReducer,
  medicines: medicineReducer,
  logs: logsReducer,
  caregivers: caregiverReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// This passes the created store instance to your axios config
injectStore(store); 

export const persistor = persistStore(store);