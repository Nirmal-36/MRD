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
import { PersonAdd as RegisterIcon } from '@mui/icons-material';

const PatientRegister = () => {
  const navigate = useNavigate();
  const { patientRegister } = useAuth();
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
    department: {
      required: { message: 'Department is required' },
    },
  };

  const {
    values: formData,
    errors,
    touched,
    handleChange: handleValidationChange,
    handleBlur,
    validateAll,
  } = useFormValidation({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    phone: '',
    user_type: 'student',
    student_id: '',
    employee_id: '',
    department: '',
    year_of_study: '',
    course: '',
  }, validationRules);

  const handleChange = (e) => {
    handleValidationChange(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateAll();
    if (!isValid) {
      showError('Please fix the validation errors');
      return;
    }

    if (formData.user_type === 'student' && !formData.student_id) {
      showError('Student ID is required for students');
      return;
    }

    if (formData.user_type === 'employee' && !formData.employee_id) {
      showError('Employee ID is required for employees');
      return;
    }

    setLoading(true);

    const result = await patientRegister(formData);

    if (result.success) {
      showSuccess('Registration successful! Welcome to MRD System.');
      setTimeout(() => {
        navigate('/patient');
      }, 1000);
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
    <Container 
      maxWidth="md"
      sx={{
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 3, sm: 4, md: 5 },
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 3, sm: 4, md: 5 }, 
            width: '100%',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
            <RegisterIcon sx={{ fontSize: { xs: 50, sm: 60 }, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
              Patient Registration
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Register to access medical services
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* User Type */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="I am a"
                  name="user_type"
                  value={formData.user_type}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="employee">Employee/Staff</MenuItem>
                </TextField>
              </Grid>

              {/* Student ID or Employee ID */}
              {formData.user_type === 'student' ? (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Student ID/Roll Number"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleChange}
                    required
                    helperText="Your unique student identification number"
                  />
                </Grid>
              ) : (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    required
                    helperText="Your employee identification number"
                  />
                </Grid>
              )}

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

              {/* Department - Dropdown for academic departments */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  error={touched.department && Boolean(errors.department)}
                  helperText={
                    touched.department && errors.department
                      ? errors.department
                      : formData.user_type === 'student'
                      ? 'Select your academic department'
                      : 'Select your work department'
                  }
                >
                  <MenuItem value="">
                    <em>Select Department</em>
                  </MenuItem>
                  <MenuItem value="CSE">Computer Science and Engineering (CSE)</MenuItem>
                  <MenuItem value="ECE">Electronics and Communication Engineering (ECE)</MenuItem>
                  <MenuItem value="AIDS">Artificial Intelligence and Data Science (AIDS)</MenuItem>
                </TextField>
              </Grid>

              {/* Conditional Fields for Students */}
              {formData.user_type === 'student' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Course/Program"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      helperText="e.g., B.Tech, M.Sc, etc."
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Year of Study"
                      name="year_of_study"
                      value={formData.year_of_study}
                      onChange={handleChange}
                      helperText="e.g., 1st Year, 2nd Year"
                    />
                  </Grid>
                </>
              )}

              {/* Conditional Fields for Employees */}
              {formData.user_type === 'employee' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    helperText="Your job title"
                  />
                </Grid>
              )}

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
              sx={{ 
                mt: 3, 
                mb: 2,
                py: { xs: 1.5, sm: 1.75 },
                fontSize: { xs: '0.95rem', sm: '1rem' },
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                Already have an account?{' '}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                  disabled={loading}
                  sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
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

export default PatientRegister;
