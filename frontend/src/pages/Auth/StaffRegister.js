import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  CircularProgress,
  MenuItem,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { useFormValidation } from '../../hooks/useFormValidation';
import PasswordStrengthIndicator from '../../components/common/PasswordStrengthIndicator';
import { MedicalServices as MedicalIcon } from '@mui/icons-material';

const StaffRegister = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);

  const validationRules = {
    username: {
      required: { message: 'Username is required' },
      minLength: { value: 3, message: 'Username must be at least 3 characters' },
    },
    email: {
      required: { message: 'Email is required' },
      pattern: { value: /^[^\s@]+@klh\.edu\.in$/, message: 'Email must end with @klh.edu.in' },
    },
    password: {
      required: { message: 'Password is required' },
      minLength: { value: 8, message: 'Password must be at least 8 characters' },
    },
    confirm_password: {
      required: { message: 'Confirm password is required' },
      custom: {
        validate: (value, values) => value === values.password,
        message: 'Passwords do not match',
      },
    },
    first_name: {
      required: { message: 'First name is required' },
    },
    last_name: {
      required: { message: 'Last name is required' },
    },
    phone: {
      pattern: { value: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit Indian phone number' },
    },
    employee_id: {
      required: { message: 'Employee ID is required' },
    },
  };

  const {
    values: formData,
    errors,
    touched,
    handleChange: handleValidationChange,
    handleBlur,
    validateAll,
    setValue,
  } = useFormValidation({
    username: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    user_type: 'doctor',
    employee_id: '',
    department: '',
    designation: '',
  }, validationRules);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear department when principal is selected
    if (name === 'user_type' && value === 'principal') {
      setValue('user_type', value);
      setValue('department', '');
    } else {
      handleValidationChange(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateAll();
    if (!isValid) {
      showError('Please fix the validation errors');
      return;
    }

    if (formData.user_type === 'hod' && !formData.department) {
      showError('Department is required for Head of Department');
      return;
    }

    setLoading(true);

    const result = await register(formData);

    if (result.success) {
      showSuccess('Registration successful! Your account is pending admin approval.');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      const errorMsg = typeof result.error === 'object'
        ? Object.entries(result.error)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n')
        : result.error;
      showError(errorMsg || 'Registration failed. Please check your information.');
    }

    setLoading(false);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <MedicalIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Staff Registration
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Register as Medical Staff, Principal, or HOD
            </Typography>
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              ⚠️ Your account will need admin approval before you can access the system
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Role Selection */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Role"
                  name="user_type"
                  value={formData.user_type}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="doctor">Doctor (includes all medical duties)</MenuItem>
                  <MenuItem value="nurse">Nurse</MenuItem>
                  <MenuItem value="pharmacist">Pharmacist/Stock Manager</MenuItem>
                  <MenuItem value="principal">Principal</MenuItem>
                  <MenuItem value="hod">Head of Department (HOD)</MenuItem>
                </TextField>
              </Grid>

              {/* Employee ID */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  error={touched.employee_id && Boolean(errors.employee_id)}
                  helperText={touched.employee_id && errors.employee_id ? errors.employee_id : 'Your official employee identification number'}
                />
              </Grid>

              {/* Username */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username ? errors.username : 'Choose a unique username'}
                />
              </Grid>

              {/* Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  error={touched.first_name && Boolean(errors.first_name)}
                  helperText={touched.first_name && errors.first_name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  error={touched.last_name && Boolean(errors.last_name)}
                  helperText={touched.last_name && errors.last_name}
                />
              </Grid>

              {/* Contact */}
              {/* Contact */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email ? errors.email : 'Must be @klh.edu.in email'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number (Optional)"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  inputProps={{
                    maxLength: 10,
                    pattern: '[6-9][0-9]{9}',
                  }}
                  error={touched.phone && Boolean(errors.phone)}
                  helperText={touched.phone && errors.phone ? errors.phone : '10-digit Indian mobile number (optional)'}
                />
              </Grid>

              {/* Department - Dropdown for HOD, Text field for medical staff */}
              <Grid item xs={12} sm={6}>
                {formData.user_type === 'hod' ? (
                  <TextField
                    fullWidth
                    select
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    helperText="Select the academic department you will oversee"
                  >
                    <MenuItem value="CSE">Computer Science and Engineering (CSE)</MenuItem>
                    <MenuItem value="ECE">Electronics and Communication Engineering (ECE)</MenuItem>
                    <MenuItem value="AIDS">Artificial Intelligence and Data Science (AIDS)</MenuItem>
                  </TextField>
                ) : formData.user_type === 'principal' ? (
                  <TextField
                    fullWidth
                    label="Department"
                    name="department"
                    value=""
                    disabled
                    helperText="Principal oversees all departments"
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="Department (Optional)"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    helperText="e.g., Cardiology, Emergency Medicine, General Ward, etc."
                  />
                )}
              </Grid>

              {/* Designation */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  helperText="e.g., Senior Doctor, Chief Pharmacist"
                />
              </Grid>

              {/* Password */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  autoComplete="new-password"
                  inputProps={{
                    minLength: 8,
                  }}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password ? errors.password : 'Minimum 8 characters'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  autoComplete="new-password"
                  inputProps={{
                    minLength: 8,
                  }}
                  error={touched.confirm_password && Boolean(errors.confirm_password)}
                  helperText={touched.confirm_password && errors.confirm_password ? errors.confirm_password : 'Re-enter your password'}
                />
              </Grid>

              {/* Password Strength Indicator */}
              {formData.password && (
                <Grid item xs={12}>
                  <PasswordStrengthIndicator password={formData.password} />
                </Grid>
              )}
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                  disabled={loading}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default StaffRegister;
