import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Link
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { useFormValidation } from '../../hooks/useFormValidation';
import PasswordStrengthIndicator from '../../components/common/PasswordStrengthIndicator';

const steps = ['Verify Identity', 'Enter OTP', 'Reset Password'];

function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword, verifyOTP, resetPassword } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Step 1 data
  const [identifier, setIdentifier] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  
  // Step 2 data
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  
  // Step 3 validation
  const passwordValidationRules = {
    newPassword: {
      required: { message: 'New password is required' },
      minLength: { value: 8, message: 'Password must be at least 8 characters' },
    },
    confirmPassword: {
      required: { message: 'Confirm password is required' },
      custom: {
        validate: (value, values) => value === values.newPassword,
        message: 'Passwords do not match',
      },
    },
  };

  const {
    values: passwordData,
    errors: passwordErrors,
    touched: passwordTouched,
    handleChange: handlePasswordChange,
    handleBlur: handlePasswordBlur,
    validateAll: validatePasswords,
  } = useFormValidation({ newPassword: '', confirmPassword: '' }, passwordValidationRules);

  const handleStep1 = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await forgotPassword(identifier);
      if (result.success) {
        setUserInfo(result.data);
        setEmail(result.data.email);
        showSuccess(result.data.message || 'OTP sent to your email');
        setActiveStep(1);
      } else {
        showError(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      showError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await verifyOTP(email, otp);
      if (result.success) {
        showSuccess('OTP verified successfully');
        setActiveStep(2);
      } else {
        showError(result.error || 'Invalid or expired OTP');
      }
    } catch (err) {
      showError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const isValid = validatePasswords();
    if (!isValid) {
      showError('Please fix the validation errors');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(email, otp, passwordData.newPassword, passwordData.confirmPassword);
      if (result.success) {
        showSuccess('Password reset successfully! Redirecting to login...');
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        showError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      showError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);

    try {
      const result = await forgotPassword(identifier);
      if (result.success) {
        showInfo('OTP resent successfully');
      } else {
        showError(result.error || 'Failed to resend OTP');
      }
    } catch (err) {
      showError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box component="form" onSubmit={handleStep1}>
            <TextField
              fullWidth
              label="Username or Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
              margin="normal"
              helperText="Enter your username or email address"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Send OTP'}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box component="form" onSubmit={handleStep2}>
            {userInfo && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>User:</strong> {userInfo.full_name}
                </Typography>
                <Typography variant="caption" display="block">
                  OTP sent to your registered email address
                </Typography>
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoFocus
              margin="normal"
              inputProps={{ 
                maxLength: 6,
                inputMode: 'numeric',
                pattern: '[0-9]*'
              }}
              helperText="Enter the 6-digit OTP sent to your email. OTP is valid for 10 minutes."
            />
            
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              <Typography variant="caption">
                Didn't receive OTP? Click 'Resend OTP' below
              </Typography>
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setActiveStep(0);
                  setOtp('');
                }}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || otp.length !== 6}
              >
                {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
              </Button>
            </Box>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="text"
                size="small"
                onClick={handleResendOTP}
                disabled={loading}
              >
                Resend OTP
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box component="form" onSubmit={handleResetPassword}>
            <Alert severity="success" sx={{ mb: 2 }}>
              OTP verified successfully! Now set your new password.
            </Alert>
            
            <TextField
              fullWidth
              label="New Password"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              required
              autoFocus
              margin="normal"
              error={passwordTouched.newPassword && Boolean(passwordErrors.newPassword)}
              helperText={passwordTouched.newPassword && passwordErrors.newPassword ? passwordErrors.newPassword : 'Minimum 8 characters'}
            />
            
            {passwordData.newPassword && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <PasswordStrengthIndicator password={passwordData.newPassword} />
              </Box>
            )}
            
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              required
              margin="normal"
              error={passwordTouched.confirmPassword && Boolean(passwordErrors.confirmPassword)}
              helperText={passwordTouched.confirmPassword && passwordErrors.confirmPassword}
            />
            
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setActiveStep(1)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Reset Password'}
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container 
      maxWidth="sm"
      sx={{
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ mt: { xs: 4, sm: 6, md: 8 }, mb: { xs: 3, sm: 4 } }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 3, sm: 4, md: 5 }, 
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 3, sm: 4 } }}>
            <LockResetIcon sx={{ fontSize: { xs: 50, sm: 60 }, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
              Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Follow the steps to reset your password
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: { xs: 3, sm: 4 } }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent()}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/login')}
              sx={{ cursor: 'pointer' }}
            >
              Remember your password? Sign in
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default ForgotPassword;
