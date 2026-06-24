import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Retrieve cached user/token from localStorage
const token = localStorage.getItem('token') || null;
let user = null;
try {
  const cachedUser = localStorage.getItem('user');
  user = cachedUser ? JSON.parse(cachedUser) : null;
} catch (e) {
  console.error('Failed to parse cached user:', e);
}

const initialState = {
  user,
  token,
  loading: false,
  error: null,
};

// Async login action
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { token, ...userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    return { token, user: userData };
  } catch (error) {
    const message = error.response?.data?.message || 'Login failed';
    return rejectWithValue(message);
  }
});

// Async registration action
export const register = createAsyncThunk('auth/register', async (details, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', details);
    const { token, ...userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    return { token, user: userData };
  } catch (error) {
    const message = error.response?.data?.message || 'Registration failed';
    return rejectWithValue(message);
  }
});

// Async getMe (Refresh Session)
export const checkAuthSession = createAsyncThunk('auth/checkSession', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return rejectWithValue('Session expired');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateProfileSuccess(state, action) {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    updateAvatarSuccess(state, action) {
      if (state.user) {
        state.user.avatar = action.payload;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    clearAuthError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Check auth session
      .addCase(checkAuthSession.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(checkAuthSession.rejected, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

export const { logout, updateProfileSuccess, updateAvatarSuccess, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
