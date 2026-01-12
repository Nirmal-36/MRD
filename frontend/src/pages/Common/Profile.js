import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Alert, CircularProgress,
  TextField, Button, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, InputAdornment,
  Chip, useTheme, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon
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
  
  // Profile change request state
  const [changeRequestDialogOpen, setChangeRequestDialogOpen] = useState(false);
  const [changeRequestForm, setChangeRequestForm] = useState({
    requested_first_name: '',
    requested_last_name: '',
    requested_username: '',
    reason: ''
  });
  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchMyRequests();
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
  
  // Profile change request functions
  const fetchMyRequests = async () => {
    try {
      setRequestsLoading(true);
      const response = await apiService.getMyProfileChangeRequests();
      setMyRequests(response.data || []);
    } catch (err) {
      console.error('Error fetching change requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };
  
  const handleOpenChangeRequestDialog = () => {
    // Initialize form with current values
    setChangeRequestForm({
      requested_first_name: profileData?.first_name || '',
      requested_last_name: profileData?.last_name || '',
      requested_username: profileData?.username || '',
      reason: ''
    });
    setChangeRequestDialogOpen(true);
  };
  
  const handleCloseChangeRequestDialog = () => {
    setChangeRequestDialogOpen(false);
    setChangeRequestForm({
      requested_first_name: '',
      requested_last_name: '',
      requested_username: '',
      reason: ''
    });
    setError('');
  };
  
  const handleSubmitChangeRequest = async () => {
    try {
      // Validate that at least one field changed
      const firstNameChanged = changeRequestForm.requested_first_name !== profileData?.first_name;
      const lastNameChanged = changeRequestForm.requested_last_name !== profileData?.last_name;
      const usernameChanged = changeRequestForm.requested_username !== profileData?.username;
      
      if (!firstNameChanged && !lastNameChanged && !usernameChanged) {
        setError('Please change at least one field (first name, last name, or username)');
        return;
      }
      
      if (!changeRequestForm.reason.trim()) {
        setError('Please provide a reason for this change request');
        return;
      }
      
      await apiService.createProfileChangeRequest({
        requested_first_name: changeRequestForm.requested_first_name || profileData?.first_name,
        requested_last_name: changeRequestForm.requested_last_name || profileData?.last_name,
        requested_username: changeRequestForm.requested_username || profileData?.username,
        reason: changeRequestForm.reason
      });
      
      setSuccess('Profile change request submitted successfully! Wait for admin approval.');
      setError('');
      handleCloseChangeRequestDialog();
      fetchMyRequests(); // Refresh requests list
      
      // Auto-hide success message
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error submitting change request:', err);
      const errorMsg = err.response?.data?.error || 
                      err.response?.data?.requested_username?.[0] ||
                      err.response?.data?.reason?.[0] ||
                      err.response?.data?.non_field_errors?.[0] ||
                      'Failed to submit change request';
      setError(errorMsg);
    }
  };
  
  const handleOpenCancelDialog = (request) => {
    setRequestToCancel(request);
    setCancelDialogOpen(true);
  };
  
  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setRequestToCancel(null);
  };
  
  const handleConfirmCancel = async () => {
    try {
      await apiService.deleteProfileChangeRequest(requestToCancel.id);
      setSuccess('Request cancelled successfully');
      handleCloseCancelDialog();
      fetchMyRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error cancelling request:', err);
      setError(err.response?.data?.error || 'Failed to cancel request');
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
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
            startIcon={<PersonAddIcon />}
            onClick={handleOpenChangeRequestDialog}
            sx={{ mr: theme.spacing(2) }}
          >
            Request Name/Username Change
          </Button>
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

      {/* My Change Requests */}
      {myRequests.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={theme.typography.h6.fontWeight}>
              My Profile Change Requests
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Requested Changes</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Admin Response</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {myRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Box>
                          {request.requested_first_name !== request.current_first_name && (
                            <Typography variant="body2">
                              First Name: {request.current_first_name} → <strong>{request.requested_first_name}</strong>
                            </Typography>
                          )}
                          {request.requested_last_name !== request.current_last_name && (
                            <Typography variant="body2">
                              Last Name: {request.current_last_name} → <strong>{request.requested_last_name}</strong>
                            </Typography>
                          )}
                          {request.requested_username !== request.current_username && (
                            <Typography variant="body2">
                              Username: {request.current_username} → <strong>{request.requested_username}</strong>
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{request.reason}</TableCell>
                      <TableCell>
                        <Chip 
                          label={request.status_display} 
                          color={getStatusColor(request.status)} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {request.admin_notes || '-'}
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleOpenCancelDialog(request)}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Cancel Request Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Profile Change Request</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this profile change request?
          </Typography>
          {requestToCancel && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2">
                <strong>Requested Changes:</strong>
              </Typography>
              {requestToCancel.requested_first_name !== requestToCancel.current_first_name && (
                <Typography variant="body2">
                  First Name: {requestToCancel.current_first_name} → {requestToCancel.requested_first_name}
                </Typography>
              )}
              {requestToCancel.requested_last_name !== requestToCancel.current_last_name && (
                <Typography variant="body2">
                  Last Name: {requestToCancel.current_last_name} → {requestToCancel.requested_last_name}
                </Typography>
              )}
              {requestToCancel.requested_username !== requestToCancel.current_username && (
                <Typography variant="body2">
                  Username: {requestToCancel.current_username} → {requestToCancel.requested_username}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>No, Keep It</Button>
          <Button onClick={handleConfirmCancel} variant="contained" color="error">
            Yes, Cancel Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Change Request Dialog */}
      <Dialog 
        open={changeRequestDialogOpen} 
        onClose={handleCloseChangeRequestDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Request Profile Change
          <IconButton
            onClick={handleCloseChangeRequestDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Changes to your name and username require admin approval. Once approved, your profile will be updated automatically.
            </Alert>
            
            <TextField
              label="First Name"
              value={changeRequestForm.requested_first_name}
              onChange={(e) => setChangeRequestForm({ ...changeRequestForm, requested_first_name: e.target.value })}
              fullWidth
              helperText={`Current: ${profileData?.first_name || 'Not set'}`}
            />
            
            <TextField
              label="Last Name"
              value={changeRequestForm.requested_last_name}
              onChange={(e) => setChangeRequestForm({ ...changeRequestForm, requested_last_name: e.target.value })}
              fullWidth
              helperText={`Current: ${profileData?.last_name || 'Not set'}`}
            />
            
            <TextField
              label="Username"
              value={changeRequestForm.requested_username}
              onChange={(e) => setChangeRequestForm({ ...changeRequestForm, requested_username: e.target.value })}
              fullWidth
              helperText={`Current: ${profileData?.username}`}
            />
            
            <TextField
              label="Reason for Change"
              value={changeRequestForm.reason}
              onChange={(e) => setChangeRequestForm({ ...changeRequestForm, reason: e.target.value })}
              fullWidth
              multiline
              rows={3}
              required
              helperText="Please explain why you need to change your profile information"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseChangeRequestDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitChangeRequest} 
            variant="contained"
            disabled={!changeRequestForm.reason.trim()}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

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
