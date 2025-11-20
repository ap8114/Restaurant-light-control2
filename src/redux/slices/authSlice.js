// src/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';
import axios from 'axios';
import { apiUrl } from '../../utils/config';

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  role: localStorage.getItem('role') || null,
  loading: false,
  error: null,
};

// 🔹 LOGIN USER
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/auth/login`, credentials, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log(response);

      // Check if the response is successful
      if (response.status !== 200 || !response.data.success) {
        return rejectWithValue(response.data.message || 'Login failed');
      }

      const { user, token } = response.data.data;

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem("permissions", JSON.stringify(user.permissions));

      return { user, token };
    } catch (err) {
      // Handle different error scenarios
      if (err.response) {
        // Server responded with error status
        return rejectWithValue(err.response.data?.message || 'Invalid credentials');
      } else if (err.request) {
        // Network error
        return rejectWithValue('Network error. Please check your connection.');
      } else {
        // Other error
        return rejectWithValue('An unexpected error occurred.');
      }
    }
  }
);

// 🔹 REGISTER USER
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}/auth/register`, userData, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status !== 200 || !response.data.success) {
        return rejectWithValue(response.data.message || 'Registration failed');
      }

      return response.data;
    } catch (err) {
      if (err.response) {
        return rejectWithValue(err.response.data?.message || 'Registration failed');
      } else if (err.request) {
        return rejectWithValue('Network error. Please check your connection.');
      } else {
        return rejectWithValue('An unexpected error occurred.');
      }
    }
  }
);

// 🔹 FETCH CURRENT USER (with axiosInstance)
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/users/me');

      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch user');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        return rejectWithValue('Session expired. Please login again.');
      }
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
    }
  }
);

// 🔹 LOGOUT (can be enhanced to call backend logout endpoint)
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Optional: Call backend logout endpoint
      // await axiosInstance.post('/auth/logout');

      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      // localStorage.removeItem('rememberedEmail'); // Clear remembered email too

      return true;
    } catch (err) {
      // Even if backend call fails, clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('rememberedEmail');

      return rejectWithValue(err.response?.data?.message || 'Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous logout (for immediate logout without backend call)
    logout: (state) => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('rememberedEmail');
      state.user = null;
      state.token = null;
      state.role = null;
      state.error = null;
    },
    clearMessages: (state) => {
      state.error = null;
    },
    // Update user data (useful for profile updates)
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user.role;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.token = null;
        state.role = null;
      })

      // REGISTER
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH CURRENT USER
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Don't clear user data here as it might be a network issue
      })

      // LOGOUT
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.role = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        // Still clear user data even if logout fails
        state.user = null;
        state.token = null;
        state.role = null;
        state.error = action.payload;
      });
  },
});

export const { logout, clearMessages, updateUser } = authSlice.actions;
export default authSlice.reducer;