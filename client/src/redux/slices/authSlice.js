/**
 * FILE: client/src/redux/slices/authSlice.js
 * ================================================================
 * YE FILE KYA HAI: Login/Register/Session ka poora frontend state
 * management — "auth" slice of the Redux store.
 *
 * TEEN ASYNC ACTIONS (createAsyncThunk):
 *   1. login()            → Email/password se login karta hai,
 *                           token + user localStorage mein save karta hai
 *   2. register()          → Naya account banata hai, turant login bhi
 *                           kar deta hai (backend register ke saath token bhejta hai)
 *   3. checkAuthSession()  → Page refresh hone pe ye chalta hai (App.jsx
 *                           se) — dekhta hai ki saved token abhi bhi
 *                           valid hai ya nahi. Agar expired ho gaya,
 *                           localStorage clear karke user ko logged-out
 *                           kar deta hai.
 *
 * LOCALSTORAGE PERSISTENCE: Token aur user dono localStorage mein save
 * hote hain — isliye browser band karke dobara khole tab bhi login
 * yaad rehta hai (jab tak token expire na ho).
 *
 * SYNC REDUCERS: logout, updateProfileSuccess, updateAvatarSuccess,
 * clearAuthError — ye instant (non-API) state changes hain, jaise
 * profile update hone ke baad Redux state ko turant refresh karna
 * (bina dobara /auth/me call kiye).
 *
 * PROJECT MEIN ROLE: LoginPage.jsx, RegisterPage.jsx, ProfilePage.jsx,
 * aur App.jsx (session check ke liye) sab is slice ko use karte hain.
 * Navbar.jsx bhi `user` state se decide karta hai login/logout UI dikhana.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Page load hote hi localStorage se pehle se saved session (agar hai) uthao
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

// Login — backend se token milta hai, localStorage mein persist karo
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

// Register — naya account, backend turant login token bhi de deta hai
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

// App load/refresh hone pe session verify karo — token expire ho gaya
// ho toh localStorage clean karke logout state mein bhej do
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
    // Manual logout — user khud "Sign Out" dabaye
    logout(state) {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    // ProfilePage se naam/email update hone ke baad Redux state turant refresh
    updateProfileSuccess(state, action) {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    // Avatar upload hone ke baad sirf avatar field update karo
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
      // Login lifecycle
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
      // Register lifecycle
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
      // Session check lifecycle (silent — koi loading spinner nahi dikhate isके liye)
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
