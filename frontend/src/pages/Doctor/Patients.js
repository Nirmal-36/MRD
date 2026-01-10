import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Autocomplete,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import apiService from '../../services/api';

const Patients = () => {
  const theme = useTheme();
  const [patients, setPatients] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    user: null,
    employee_student_id: '',
    name: '',
    age: '',
    gender: 'M',
    phone: '',
    patient_type: 'student',
    blood_group: '',
    allergies: '',
    chronic_conditions: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (userSearchTerm.length >= 2) {
      searchRegisteredUsers();
    } else {
      setRegisteredUsers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPatients();
      setPatients(response.data.results || response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const searchRegisteredUsers = async () => {
    try {
      const response = await apiService.searchUsers(userSearchTerm);
      const users = response.data?.users || response.data || [];
      setRegisteredUsers(users);
    } catch (err) {
      console.error('Error searching users:', err);
      setRegisteredUsers([]);
    }
  };

  const handleOpenDialog = (patient = null) => {
    if (patient) {
      setSelectedPatient(patient);
      setFormData({
        user: patient.user,
        employee_student_id: patient.employee_student_id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        patient_type: patient.patient_type,
        blood_group: patient.blood_group || '',
        allergies: patient.allergies || '',
        chronic_conditions: patient.chronic_conditions || '',
      });
    } else {
      setSelectedPatient(null);
      setFormData({
        user: null,
        employee_student_id: '',
        name: '',
        age: '',
        gender: 'M',
        phone: '',
        patient_type: 'student',
        blood_group: '',
        allergies: '',
        chronic_conditions: '',
      });
      setUserSearchTerm('');
      setRegisteredUsers([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPatient(null);
    setUserSearchTerm('');
    setRegisteredUsers([]);
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setViewDialog(true);
  };

  const handleUserSelect = (user) => {
    if (user) {
      setFormData({
        ...formData,
        user: user.id,
        employee_student_id: user.employee_id || user.student_id || '',
        name: user.full_name || `${user.first_name} ${user.last_name}`,
        phone: user.phone || '',
        patient_type: user.user_type === 'student' ? 'student' : 'staff',
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        gender: formData.gender,
      };

      if (selectedPatient) {
        await apiService.updatePatient(selectedPatient.id, submitData);
        setSuccess('Patient medical record updated successfully');
      } else {
        await apiService.createPatient(submitData);
        setSuccess('Patient medical record created successfully');
      }
      handleCloseDialog();
      fetchPatients();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving patient:', err);
      const errorMsg = err.response?.data?.error || 
                      err.response?.data?.message ||
                      JSON.stringify(err.response?.data) ||
                      'Failed to save patient';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.employee_student_id?.includes(searchTerm) ||
    patient.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={theme.spacing(3)}>
        <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
          Patient Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Add Patient Medical Record
        </Button>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: theme.spacing(2) }}>
        <Typography variant="body2">
          <strong>Note:</strong> Patients must register their accounts first at the registration page.
          Here you can create their medical records and add medical details like blood group, allergies, etc.
        </Typography>
      </Alert>

      {/* Alerts */}
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

      {/* Search Bar */}
      <Card sx={{ mb: theme.spacing(3) }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by name, ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
        </CardContent>
      </Card>

      {/* Patients Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Blood Group</TableCell>
              <TableCell align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>{patient.employee_student_id}</TableCell>
                  <TableCell>{patient.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={patient.patient_type === 'student' ? 'Student' : 'Staff'} 
                      size="small"
                      color={patient.patient_type === 'student' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>
                    <Chip 
                      label={patient.blood_group || 'Not Set'} 
                      size="small" 
                      color={patient.blood_group ? 'error' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="info"
                      onClick={() => handleViewPatient(patient)}
                      size="small"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(patient)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary" py={theme.spacing(3)}>
                    No patient records found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPatient ? 'Edit Patient Medical Record' : 'Create Patient Medical Record'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: theme.spacing(2) }}>
            {!selectedPatient && (
              <Alert severity="info" sx={{ mb: theme.spacing(2) }}>
                Search for a registered user to create their medical record
              </Alert>
            )}

            <Grid container spacing={theme.spacing(2)}>
              {/* User Selection - Only for new patients */}
              {!selectedPatient && (
                <Grid item xs={12}>
                  <Autocomplete
                    options={Array.isArray(registeredUsers) ? registeredUsers : []}
                    getOptionLabel={(option) => 
                      option ? `${option.full_name || option.username} - ${option.employee_id || option.student_id} ${option.has_medical_record ? '(Has Record)' : ''}` : ''
                    }
                    getOptionDisabled={(option) => option?.has_medical_record || false}
                    onInputChange={(event, newValue) => {
                      setUserSearchTerm(newValue || '');
                    }}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        handleUserSelect(newValue);
                      }
                    }}
                    noOptionsText={
                      userSearchTerm.length < 2 
                        ? "Type at least 2 characters to search..." 
                        : "No users found"
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Registered User"
                        placeholder="Type name, username, or ID..."
                        helperText="Search for users who have registered but don't have medical records yet"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              )}

              {/* Patient ID */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee/Student ID"
                  value={formData.employee_student_id}
                  onChange={(e) => setFormData({ ...formData, employee_student_id: e.target.value })}
                  required
                  disabled={!!selectedPatient}
                  helperText={selectedPatient ? "Cannot modify ID" : ""}
                />
              </Grid>

              {/* Patient Type */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Patient Type"
                  value={formData.patient_type}
                  onChange={(e) => setFormData({ ...formData, patient_type: e.target.value })}
                  required
                  disabled={!!selectedPatient}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="staff">Staff/Employee</MenuItem>
                </TextField>
              </Grid>

              {/* Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>

              {/* Age and Gender */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  required
                >
                  <MenuItem value="M">Male</MenuItem>
                  <MenuItem value="F">Female</MenuItem>
                  <MenuItem value="O">Other</MenuItem>
                </TextField>
              </Grid>

              {/* Phone */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>

              {/* Blood Group */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Blood Group"
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  sx={{ width: "150px" }}
                >
                  <MenuItem value="">Not Set</MenuItem>
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="AB+">AB+</MenuItem>
                  <MenuItem value="AB-">AB-</MenuItem>
                  <MenuItem value="O+">O+</MenuItem>
                  <MenuItem value="O-">O-</MenuItem>
                </TextField>
              </Grid>

              {/* Allergies */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Allergies"
                  multiline
                  rows={2}
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  helperText="List any known allergies"
                />
              </Grid>

              {/* Chronic Conditions */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chronic Conditions"
                  multiline
                  rows={2}
                  value={formData.chronic_conditions}
                  onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                  helperText="List any chronic medical conditions"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedPatient ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Patient Medical Record</DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box sx={{ mt: theme.spacing(2) }}>
              <Grid container spacing={theme.spacing(2)}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">ID</Typography>
                  <Typography variant="body1">{selectedPatient.employee_student_id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Type</Typography>
                  <Chip 
                    label={selectedPatient.patient_type === 'student' ? 'Student' : 'Staff'} 
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Name</Typography>
                  <Typography variant="body1">{selectedPatient.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Age</Typography>
                  <Typography variant="body1">{selectedPatient.age}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Gender</Typography>
                  <Typography variant="body1">
                    {selectedPatient.gender === 'M' ? 'Male' : selectedPatient.gender === 'F' ? 'Female' : 'Other'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Phone</Typography>
                  <Typography variant="body1">{selectedPatient.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Blood Group</Typography>
                  <Typography variant="body1">{selectedPatient.blood_group || 'Not Set'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Allergies</Typography>
                  <Typography variant="body1">{selectedPatient.allergies || 'None recorded'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Chronic Conditions</Typography>
                  <Typography variant="body1">{selectedPatient.chronic_conditions || 'None recorded'}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Patients;
