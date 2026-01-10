import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Alert, CircularProgress,
  TextField, Button, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, InputAdornment,
  Chip, useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const theme = useTheme();
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMe();
      setProfileData(response.data);
      
      // Initialize edit form based on user type
      const baseForm = {
        phone: response.data.phone || '',
        email: response.data.email || '',
      };
      
      // Add fields based on user type
      if (response.data.user_type === 'doctor' || response.data.user_type === 'nurse' || 
          response.data.user_type === 'pharmacist' || response.data.user_type === 'admin') {
        baseForm.employee_id = response.data.employee_id || '';
        baseForm.is_available = response.data.is_available || false;
      }
      
      if (response.data.user_type === 'student' || response.data.user_type === 'employee') {
        baseForm.student_id = response.data.student_id || '';
      }
      
      setEditForm(baseForm);
      setError('');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form
      fetchProfile();
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const response = await apiService.updateMe(editForm);
      setSuccess('Profile updated successfully!');
      setError('');
      setIsEditing(false);
      setProfileData(response.data);
      
      // Update user context if availability changed
      if ('is_available' in editForm && editForm.is_available !== profileData.is_available) {
        updateUser({ ...user, is_available: editForm.is_available });
      }
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to update profile');
      setSuccess('');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      await apiService.changePassword({
        old_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      });
      setSuccess('Password changed successfully!');
      setError('');
      setPasswordDialogOpen(false);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error changing password:', err);
      const errorMsg = err.response?.data?.error || 
                      err.response?.data?.old_password?.[0] || 
                      err.response?.data?.detail || 
                      'Failed to change password';
      setError(errorMsg);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getUserTypeLabel = (userType) => {
    const labels = {
      'doctor': 'Doctor',
      'nurse': 'Nurse',
      'pharmacist': 'Pharmacist',
      'admin': 'Administrator',
      'student': 'Student',
      'employee': 'Employee'
    };
    return labels[userType] || userType;
  };

  const getUserTypeColor = (userType) => {
    const colors = {
      'doctor': 'primary',
      'nurse': 'secondary',
      'pharmacist': 'info',
      'admin': 'error',
      'student': 'success',
      'employee': 'warning'
    };
    return colors[userType] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !profileData) {
    return (
      <Box p={theme.spacing(3)}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const isStaff = ['doctor', 'nurse', 'pharmacist', 'admin'].includes(profileData?.user_type);
  const isPatient = ['student', 'employee'].includes(profileData?.user_type);

  return (
    <Box p={theme.spacing(3)}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={theme.spacing(3)}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={theme.typography.h4.fontWeight}>
            My Profile
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your account information and settings
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<LockIcon />}
            onClick={() => setPasswordDialogOpen(true)}
            sx={{ mr: theme.spacing(2) }}
          >
            Change Password
          </Button>
          <Button
            variant={isEditing ? "outlined" : "contained"}
            startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
            onClick={handleEditToggle}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: theme.spacing(2) }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: theme.spacing(2) }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={theme.spacing(2)}>
            <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>
              Personal Information
            </Typography>
            <Chip 
              label={getUserTypeLabel(profileData?.user_type)} 
              color={getUserTypeColor(profileData?.user_type)}
              size="small"
            />
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Name and Username */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Full Name"
                value={profileData?.full_name || ''}
                fullWidth
                disabled
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Username"
                value={profileData?.username || ''}
                fullWidth
                disabled
                InputProps={{ readOnly: true }}
              />
            </Box>

            {/* Email and Phone */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={isEditing ? editForm.email : profileData?.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                fullWidth
                disabled={!isEditing}
                InputProps={{ readOnly: !isEditing }}
              />
              <TextField
                label="Phone"
                value={isEditing ? editForm.phone : profileData?.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                fullWidth
                disabled={!isEditing}
                InputProps={{ readOnly: !isEditing }}
              />
            </Box>

            {/* Staff-specific fields */}
            {isStaff && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Employee ID"
                  value={isEditing ? editForm.employee_id : profileData?.employee_id || ''}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                  fullWidth
                  disabled={!isEditing}
                  InputProps={{ readOnly: !isEditing }}
                />
                <TextField
                  label="Display ID"
                  value={profileData?.display_id || ''}
                  fullWidth
                  disabled
                  InputProps={{ readOnly: true }}
                />
              </Box>
            )}

            {/* Patient-specific fields */}
            {isPatient && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label={profileData?.user_type === 'student' ? 'Student ID' : 'Employee ID'}
                  value={isEditing ? editForm.student_id : profileData?.student_id || ''}
                  onChange={(e) => handleInputChange('student_id', e.target.value)}
                  fullWidth
                  disabled={!isEditing}
                  InputProps={{ readOnly: !isEditing }}
                />
                <TextField
                  label="Display ID"
                  value={profileData?.display_id || ''}
                  fullWidth
                  disabled
                  InputProps={{ readOnly: true }}
                />
              </Box>
            )}


            {isEditing && (
              <Box display="flex" justifyContent="flex-end" gap={theme.spacing(2)}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleEditToggle}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                >
                  Save Changes
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => togglePasswordVisibility('current')} edge="end">
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="New Password"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              fullWidth
              helperText="Must be at least 8 characters long"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => togglePasswordVisibility('new')} edge="end">
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Confirm New Password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => togglePasswordVisibility('confirm')} edge="end">
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handlePasswordChange} 
            variant="contained"
            disabled={!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
