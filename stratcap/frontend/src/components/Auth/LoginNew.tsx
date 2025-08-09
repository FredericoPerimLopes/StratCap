import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Container,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';

import { RootState } from '../../store/store';
import { setCredentials } from '../../store/slices/authSlice';

// Simplified validation for testing - just require non-empty fields
const validationSchema = yup.object({
  email: yup
    .string()
    .required('Email address is required'),
  password: yup
    .string()
    .required('Password is required'),
});

const LoginNew: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, user } = useSelector((state: RootState) => state.auth);
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        // TESTING BYPASS: Skip actual API call and set mock user data
        const mockUser = {
          id: 1,
          email: values.email,
          firstName: 'Test',
          lastName: 'User',
          role: 'admin' as const,
          isActive: true,
          mfaEnabled: false,
          lastLogin: new Date().toISOString(),
        };

        const mockTokens = {
          token: 'mock-jwt-token-for-testing',
          refreshToken: 'mock-refresh-token-for-testing'
        };

        // Store tokens in localStorage for consistency
        localStorage.setItem('token', mockTokens.token);
        localStorage.setItem('refreshToken', mockTokens.refreshToken);

        // Set credentials directly in Redux store
        dispatch(setCredentials({
          user: mockUser,
          token: mockTokens.token,
          refreshToken: mockTokens.refreshToken
        }));

        // Navigate to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Login bypass error:', error);
      }
    },
  });

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          {/* Left Side - Branding */}
          <Box sx={{ flex: 1, pr: 8, display: { xs: 'none', md: 'block' } }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  mb: 2,
                  letterSpacing: '-0.02em',
                }}
              >
                StratCap
              </Typography>
              
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                Professional Fund Administration & Portfolio Management Platform
              </Typography>

              <Box sx={{ mb: 4 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Trusted by leading fund managers worldwide
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'success.main' 
                      }} 
                    />
                    <Typography variant="body2" color="text.secondary">
                      Enterprise Security & Compliance
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'success.main' 
                      }} 
                    />
                    <Typography variant="body2" color="text.secondary">
                      Real-time Fund Administration
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'success.main' 
                      }} 
                    />
                    <Typography variant="body2" color="text.secondary">
                      Advanced Portfolio Analytics
                    </Typography>
                  </Box>
                </Box>
              </Box>
          </Box>

          {/* Right Side - Login Form */}
          <Box sx={{ flex: 1, maxWidth: 500 }}>
            <Card
              sx={{
                maxWidth: 440,
                mx: 'auto',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                borderRadius: 3,
                border: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              <CardContent sx={{ p: 5 }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 1,
                    }}
                  >
                    Welcome back
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary">
                    Sign in to your account
                  </Typography>
                  
                  {/* Testing Mode Indicator */}
                  <Box
                    sx={{
                      mt: 2,
                      p: 1,
                      backgroundColor: 'warning.light',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'warning.main'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'warning.dark' }}>
                      🧪 TESTING MODE: Any email/password will work
                    </Typography>
                  </Box>
                </Box>

                {/* Error Alert */}
                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                    }}
                  >
                    {error}
                  </Alert>
                )}

                {/* Login Form */}
                <form onSubmit={formik.handleSubmit}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email Address"
                    type="email"
                    autoComplete="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                  />

                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                            disabled={isLoading}
                            size="small"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          color="primary"
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.secondary">
                          Remember me
                        </Typography>
                      }
                    />
                    
                    <Link
                      to="/auth/forgot-password"
                      style={{
                        textDecoration: 'none',
                        color: '#1976d2',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading || !formik.isValid}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 2,
                      mb: 3,
                    }}
                  >
                    {isLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        <span>Signing in...</span>
                      </Box>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <Divider sx={{ mb: 3 }} />

                {/* Footer */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Link
                      to="/auth/register"
                      style={{
                        color: '#1976d2',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Request Access
                    </Link>
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    Secure • Professional • Compliant
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginNew;