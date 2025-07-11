import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  isActive: boolean;
  mfaEnabled: boolean;
  lastLogin?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string; mfaToken?: string }) => {
    const response = await authAPI.login(credentials);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data;
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => {
    const response = await authAPI.register(userData);
    return response.data;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authAPI.logout();
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }
  const response = await authAPI.getProfile();
  return response.data;
});

export const refreshTokens = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState }) => {
    const { auth } = getState() as { auth: AuthState };
    const refreshToken = auth.refreshToken || localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }
    
    const response = await authAPI.refreshToken(refreshToken);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data;
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: { firstName?: string; lastName?: string }) => {
    const response = await authAPI.updateProfile(userData);
    return response.data;
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: { currentPassword: string; newPassword: string }) => {
    await authAPI.changePassword(passwordData);
    return passwordData;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string; refreshToken: string }>) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
        state.isAuthenticated = false;
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Registration failed';
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      })
      
      // Refresh Token
      .addCase(refreshTokens.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(refreshTokens.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      })
      
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      })
      
      // Change Password
      .addCase(changePassword.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.error = action.error.message || 'Password change failed';
      });
  },
});

export const { clearError, setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;