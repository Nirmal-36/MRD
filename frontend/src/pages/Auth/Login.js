import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { useFormValidation } from '../../hooks/useFormValidation';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form validation rules
  const validationRules = {
    username: {
      required: { message: 'Username is required' },
      minLength: { value: 3, message: 'Username must be at least 3 characters' },
    },
    password: {
      required: { message: 'Password is required' },
      minLength: { value: 8, message: 'Password must be at least 8 characters' },
    },
  };

  const {
    values: formData,
    errors,
    touched,
    handleChange: handleValidationChange,
    handleBlur,
    validateAll,
    setValues,
  } = useFormValidation({ username: '', password: '' }, validationRules);

  // Load saved username if "Remember Me" was checked
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setValues({ username: savedUsername, password: '' });
      setRememberMe(true);
    }
  }, [setValues]);

  const handleChange = (e) => {
    handleValidationChange(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const isValid = validateAll();
    if (!isValid) {
      showError('Please fix the validation errors');
      return;
    }

    setLoading(true);

    const result = await login(formData);

    if (result.success) {
      // Save username if "Remember Me" is checked
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', formData.username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }

      showSuccess(`Welcome back, ${result.user.username}!`);
      
      const roleRoutes = {
        admin: '/admin',
        principal: '/principal',
        hod: '/hod',
        doctor: '/doctor',
        nurse: '/doctor',
        pharmacist: '/pharmacist',
        student: '/patient',
        employee: '/patient',
      };

      setTimeout(() => {
        navigate(roleRoutes[result.user.user_type] || '/');
      }, 500);
    } else {
      showError(result.error || 'Login failed. Please check your credentials.');
    }

    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 3, sm: 4 },
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 3, sm: 4, md: 5 }, 
            width: '100%',
            maxWidth: '500px',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
            <Box
              component="img"
              src="/klh-university-logo.png"
              alt="KLH MedCare"
              sx={{
                height: { xs: 100, sm: 120 },
                width: 'auto',
                mb: 2,
                mx: 'auto',
                display: 'block',
              }}
            />
            <Typography variant="h1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Healthcare Management Platform
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              margin="normal"
              required
              autoFocus
              disabled={loading}
              error={touched.username && Boolean(errors.username)}
              helperText={touched.username && errors.username}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              margin="normal"
              required
              disabled={loading}
              autoComplete="off"
              error={touched.password && Boolean(errors.password)}
              helperText={touched.password && errors.password}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  color="primary"
                />
              }
              label="Remember Me"
              sx={{ mt: 1, mb: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: 3, 
                mb: 2,
                py: { xs: 1.5, sm: 1.75 },
                fontSize: { xs: '0.95rem', sm: '1rem' },
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/forgot-password')}
                  disabled={loading}
                  sx={{ 
                    textDecoration: 'underline',
                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
                  }}
                >
                  Forgot Password?
                </Link>
              </Typography>
              
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/register')}
                  disabled={loading}
                >
                  Register as Patient
                </Link>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Medical Staff?{' '}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/staff-register')}
                  disabled={loading}
                >
                  Register Here
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
