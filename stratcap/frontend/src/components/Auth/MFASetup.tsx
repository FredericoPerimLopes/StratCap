import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Security as SecurityIcon,
  QrCode as QrCodeIcon,
  Smartphone as SmartphoneIcon,
  Key as KeyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import QRCode from 'qrcode.react';
import api from '../../services/api';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';

interface MFASetupData {
  verificationCode: string;
}

const validationSchema = Yup.object({
  verificationCode: Yup.string()
    .required('Verification code is required')
    .length(6, 'Verification code must be 6 digits')
    .matches(/^\d+$/, 'Verification code must contain only numbers'),
});

const MFASetup: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  
  const [activeStep, setActiveStep] = useState(0);
  const [mfaSetupData, setMfaSetupData] = useState<any>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const response = await api.get('/auth/mfa/status');
      if (response.data.data.isEnabled) {
        setSetupComplete(true);
        setActiveStep(3);
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
    }
  };

  const initiateMFASetup = async () => {
    try {
      setLoading(true);
      const response = await api.post('/auth/mfa/setup');
      setMfaSetupData(response.data.data);
      setBackupCodes(response.data.data.backupCodes);
      setActiveStep(1);
    } catch (error: any) {
      console.error('Error initiating MFA setup:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to initiate MFA setup',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik<MFASetupData>({
    initialValues: {
      verificationCode: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        await api.post('/auth/mfa/verify-setup', {
          token: values.verificationCode,
          secret: mfaSetupData.secret,
        });
        
        setSetupComplete(true);
        setActiveStep(2);
        enqueueSnackbar('MFA setup completed successfully', { variant: 'success' });
      } catch (error: any) {
        console.error('Error verifying MFA:', error);
        enqueueSnackbar(
          error.response?.data?.message || 'Invalid verification code',
          { variant: 'error' }
        );
      } finally {
        setLoading(false);
      }
    },
  });

  const disableMFA = async () => {
    try {
      setLoading(true);
      await api.post('/auth/mfa/disable');
      setSetupComplete(false);
      setActiveStep(0);
      setMfaSetupData(null);
      enqueueSnackbar('MFA disabled successfully', { variant: 'info' });
    } catch (error: any) {
      console.error('Error disabling MFA:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to disable MFA',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    enqueueSnackbar('Backup codes copied to clipboard', { variant: 'success' });
  };

  const downloadBackupCodes = () => {
    const codesText = `StratCap MFA Backup Codes\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join('\n')}\n\nStore these codes securely. Each code can only be used once.`;
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stratcap-mfa-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    enqueueSnackbar('Backup codes downloaded', { variant: 'success' });
  };

  const steps = [
    {
      label: 'Enable Multi-Factor Authentication',
      description: 'Start the MFA setup process',
    },
    {
      label: 'Scan QR Code',
      description: 'Add your account to an authenticator app',
    },
    {
      label: 'Verify Setup',
      description: 'Enter verification code to complete setup',
    },
    {
      label: 'Save Backup Codes',
      description: 'Store backup codes in a secure location',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Multi-Factor Authentication
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">
                  Secure Your Account
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                Multi-factor authentication adds an extra layer of security to your account.
                You'll need an authenticator app like Google Authenticator or Authy.
              </Alert>

              <Stepper activeStep={activeStep} orientation="vertical">
                {/* Step 0: Enable MFA */}
                <Step>
                  <StepLabel>
                    <Typography variant="subtitle1">
                      {steps[0].label}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {steps[0].description}
                    </Typography>
                    {setupComplete ? (
                      <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>
                          MFA is currently enabled on your account
                        </Alert>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={disableMFA}
                          disabled={loading}
                        >
                          Disable MFA
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={initiateMFASetup}
                        disabled={loading}
                        startIcon={<SecurityIcon />}
                      >
                        {loading ? 'Setting up...' : 'Enable MFA'}
                      </Button>
                    )}
                  </StepContent>
                </Step>

                {/* Step 1: Scan QR Code */}
                <Step>
                  <StepLabel>
                    <Typography variant="subtitle1">
                      {steps[1].label}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Scan this QR code with your authenticator app:
                    </Typography>
                    
                    {mfaSetupData?.qrCode && (
                      <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <QRCode value={mfaSetupData.qrCode} size={200} />
                      </Box>
                    )}

                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Manual Setup Key:</strong> {mfaSetupData?.secret}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        If you can't scan the QR code, enter this key manually in your authenticator app.
                      </Typography>
                    </Alert>

                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(2)}
                      disabled={!mfaSetupData}
                      startIcon={<SmartphoneIcon />}
                    >
                      I've Added the Account
                    </Button>
                  </StepContent>
                </Step>

                {/* Step 2: Verify Setup */}
                <Step>
                  <StepLabel>
                    <Typography variant="subtitle1">
                      {steps[2].label}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Enter the 6-digit verification code from your authenticator app:
                    </Typography>
                    
                    <form onSubmit={formik.handleSubmit}>
                      <TextField
                        fullWidth
                        label="Verification Code"
                        name="verificationCode"
                        value={formik.values.verificationCode}
                        onChange={formik.handleChange}
                        error={formik.touched.verificationCode && Boolean(formik.errors.verificationCode)}
                        helperText={formik.touched.verificationCode && formik.errors.verificationCode}
                        inputProps={{ maxLength: 6 }}
                        sx={{ mb: 2 }}
                      />
                      
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !formik.values.verificationCode}
                        startIcon={<KeyIcon />}
                      >
                        {loading ? 'Verifying...' : 'Verify and Enable'}
                      </Button>
                    </form>
                  </StepContent>
                </Step>

                {/* Step 3: Backup Codes */}
                <Step>
                  <StepLabel>
                    <Typography variant="subtitle1">
                      {steps[3].label}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Save these backup codes in a secure location. Each code can only be used once
                        to access your account if you lose your authenticator device.
                      </Typography>
                    </Alert>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => setShowBackupDialog(true)}
                        size="small"
                      >
                        View Codes
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={copyBackupCodes}
                        size="small"
                      >
                        Copy Codes
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={downloadBackupCodes}
                        size="small"
                      >
                        Download Codes
                      </Button>
                    </Box>

                    <Alert severity="success">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          MFA setup completed successfully! Your account is now more secure.
                        </Typography>
                      </Box>
                    </Alert>
                  </StepContent>
                </Step>
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommended Authenticator Apps
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SmartphoneIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Google Authenticator"
                    secondary="Free app for iOS and Android"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SmartphoneIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Authy"
                    secondary="Multi-device synchronization"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SmartphoneIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Microsoft Authenticator"
                    secondary="Enterprise-grade security"
                  />
                </ListItem>
              </List>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Security Tips:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Keep your backup codes in a secure location
                • Don't share your authenticator codes with anyone
                • Contact support if you lose access to your device
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Backup Codes Dialog */}
      <Dialog
        open={showBackupDialog}
        onClose={() => setShowBackupDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
            Backup Codes
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Store these codes securely. Each code can only be used once.
          </Alert>
          
          <Grid container spacing={1}>
            {backupCodes.map((code, index) => (
              <Grid item xs={6} key={index}>
                <Chip
                  label={code}
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', width: '100%' }}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={copyBackupCodes}>
            Copy All
          </Button>
          <Button onClick={downloadBackupCodes}>
            Download
          </Button>
          <Button onClick={() => setShowBackupDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MFASetup;