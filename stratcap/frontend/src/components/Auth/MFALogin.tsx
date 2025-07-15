import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  Link,
  Divider,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Smartphone as SmartphoneIcon,
  Key as KeyIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAppDispatch } from '../../hooks/redux';

interface MFALoginData {
  token: string;
}

const validationSchema = Yup.object({
  token: Yup.string()
    .required('Verification code is required')
    .matches(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

interface MFALoginProps {
  email: string;
  tempToken: string;
  onSuccess: () => void;
  onBack: () => void;
}

const MFALogin: React.FC<MFALoginProps> = ({ email, tempToken, onSuccess, onBack }) => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  const [loading, setLoading] = useState(false);
  const [isBackupCode, setIsBackupCode] = useState(false);

  const formik = useFormik<MFALoginData>({
    initialValues: {
      token: '',
    },
    validationSchema: isBackupCode ? 
      Yup.object({
        token: Yup.string()
          .required('Backup code is required')
          .length(10, 'Backup code must be exactly 10 characters'),
      }) : 
      validationSchema,
    onSubmit: async (values: MFALoginData) => {
      try {
        setLoading(true);
        
        const response = await api.post('/auth/mfa/verify', {
          tempToken,
          token: values.token,
          isBackupCode,
        });

        const { accessToken, refreshToken, user } = response.data.data;
        
        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Update API default headers
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        // Dispatch login success action
        dispatch({
          type: 'auth/loginSuccess',
          payload: { user, token: accessToken },
        });

        enqueueSnackbar('Login successful', { variant: 'success' });
        
        // Navigate to intended destination or dashboard
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
        
        onSuccess();
      } catch (error: any) {
        console.error('MFA verification error:', error);
        const message = error.response?.data?.message || 'Invalid verification code';
        enqueueSnackbar(message, { variant: 'error' });
        
        // Clear the field on error
        formik.setFieldValue('token', '');
      } finally {
        setLoading(false);
      }
    },
  });

  const handleBackupCodeToggle = () => {
    setIsBackupCode(!isBackupCode);
    formik.setFieldValue('token', '');
    formik.setFieldError('token', '');
  };

  const handleResendCode = async () => {
    try {
      await api.post('/auth/mfa/resend', { tempToken });
      enqueueSnackbar('New verification code sent', { variant: 'info' });
    } catch (error: any) {
      console.error('Error resending code:', error);
      enqueueSnackbar('Failed to resend code', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Two-Factor Authentication
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Please enter the verification code from your authenticator app
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Logging in as: <strong>{email}</strong>
            </Typography>
          </Alert>

          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              label={isBackupCode ? 'Backup Code' : 'Verification Code'}
              name="token"
              value={formik.values.token}
              onChange={formik.handleChange}
              error={formik.touched.token && Boolean(formik.errors.token)}
              helperText={formik.touched.token && formik.errors.token}
              placeholder={isBackupCode ? 'Enter 10-character backup code' : 'Enter 6-digit code'}
              inputProps={{ 
                maxLength: isBackupCode ? 10 : 6,
                style: { textAlign: 'center', letterSpacing: '0.1em' }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {isBackupCode ? <KeyIcon /> : <SmartphoneIcon />}
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
              autoComplete="one-time-code"
              autoFocus
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !formik.values.token}
              sx={{ mb: 2 }}
            >
              {loading ? 'Verifying...' : 'Verify and Login'}
            </Button>
          </form>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ textAlign: 'center', space: 1 }}>
            <Link
              component="button"
              variant="body2"
              onClick={handleBackupCodeToggle}
              sx={{ display: 'block', mb: 1 }}
            >
              {isBackupCode 
                ? 'Use authenticator app instead' 
                : 'Use backup code instead'
              }
            </Link>

            {!isBackupCode && (
              <Link
                component="button"
                variant="body2"
                onClick={handleResendCode}
                sx={{ display: 'block', mb: 1 }}
              >
                Resend verification code
              </Link>
            )}

            <Link
              component="button"
              variant="body2"
              onClick={onBack}
              color="textSecondary"
            >
              Back to login
            </Link>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
              Trouble accessing your account?
            </Typography>
            <Link
              href="/support"
              variant="caption"
              color="primary"
            >
              Contact Support
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MFALogin;