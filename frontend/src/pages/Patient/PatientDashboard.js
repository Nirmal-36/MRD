import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Divider, useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Medication as MedicationIcon,
  Hotel as BedIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import apiService from '../../services/api';

const PatientDashboard = () => {
  const theme = useTheme();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
    
    // Refresh profile data every 30 seconds to get updated doctor availability
    const refreshInterval = setInterval(() => {
      fetchProfile();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyProfile();
      setProfileData(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.error || 'Failed to load your medical profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box p={3}>
        <Alert severity="info">
          No medical profile found. Please visit the medical center to create your medical record.
        </Alert>
      </Box>
    );
  }

  const { patient, treatments, current_bed, statistics } = profileData;

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Box mb={3}>
        <Typography 
          variant="h4" 
          fontWeight={theme.typography.h4.fontWeight}
        >
          My Medical Profile
        </Typography>
      </Box>
      <Typography 
        variant="body2" 
        color="textSecondary" 
        gutterBottom
        sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
      >
        View your medical records, treatments, and prescriptions
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} mb={{ xs: 2, sm: 3 }} mt={{ xs: 0.5, sm: 1 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: theme.palette.primary.contrastText }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={theme.spacing(2)}>
                <HospitalIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2">Total Treatments</Typography>
                  <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>
                    {statistics.total_treatments}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: theme.palette.warning.contrastText }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={theme.spacing(2)}>
                <CalendarIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2">Pending Follow-ups</Typography>
                  <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>
                    {statistics.pending_followups}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: current_bed ? 'error.main' : 'success.main', color: current_bed ? theme.palette.error.contrastText : theme.palette.success.contrastText }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={theme.spacing(2)}>
                <BedIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2">Bed Status</Typography>
                  <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>
                    {current_bed ? `Bed ${current_bed.bed_number}` : 'Not Admitted'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: theme.palette.info.contrastText }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={theme.spacing(2)}>
                <PersonIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2">Blood Group</Typography>
                  <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>
                    {patient.blood_group || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Personal Information */}
      <Card sx={{ mb: theme.spacing(3) }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={theme.typography.h6.fontWeight} color="primary">
            Personal Information
          </Typography>
          <Divider sx={{ mb: theme.spacing(2) }} />
          <Grid container spacing={theme.spacing(2)}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Full Name</Typography>
              <Typography variant="body1" fontWeight={theme.typography.fontWeightMedium}>{patient.name}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                {patient.patient_type === 'employee' ? 'Employee ID' : 'Student Roll No'}
              </Typography>
              <Typography variant="body1" fontWeight={theme.typography.fontWeightMedium}>{patient.employee_student_id}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Age</Typography>
              <Typography variant="body1" fontWeight={theme.typography.fontWeightMedium}>{patient.age} years</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Gender</Typography>
              <Typography variant="body1" fontWeight={theme.typography.fontWeightMedium}>{patient.gender}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Blood Group</Typography>
              <Typography variant="body1" fontWeight={theme.typography.fontWeightMedium}>{patient.blood_group || 'Not specified'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">Phone</Typography>
              <Typography variant="body1" fontWeight={theme.typography.fontWeightMedium}>{patient.phone || 'Not provided'}</Typography>
            </Grid>
            {patient.email && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Email</Typography>
                <Typography variant="body1" fontWeight={theme.typography.fontWeightMedium}>{patient.email}</Typography>
              </Grid>
            )}
            {patient.emergency_contact && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Emergency Contact</Typography>
                <Typography variant="body1" fontWeight={theme.typography.fontWeightMedium}>{patient.emergency_contact}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Current Admission Status */}
      {current_bed && (
        <Card sx={{ mb: theme.spacing(3), bgcolor: 'error.light', color: theme.palette.error.contrastText }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={theme.typography.h6.fontWeight}>
              🏥 Currently Admitted
            </Typography>
            <Divider sx={{ mb: theme.spacing(2), bgcolor: theme.palette.error.contrastText }} />
            <Grid container spacing={theme.spacing(2)}>
              <Grid item xs={12} md={3}>
                <Typography variant="body2">Bed Number</Typography>
                <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>{current_bed.bed_number}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2">Admission Date</Typography>
                <Typography variant="body1" fontWeight={theme.typography.fontWeightMedium}>
                  {new Date(current_bed.admission_date).toLocaleDateString()}
                </Typography>
              </Grid>
              {current_bed.expected_discharge && (
                <Grid item xs={12} md={3}>
                  <Typography variant="body2">Expected Discharge</Typography>
                  <Typography variant="body1" fontWeight={theme.typography.fontWeightMedium}>
                    {new Date(current_bed.expected_discharge).toLocaleDateString()}
                  </Typography>
                </Grid>
              )}
              {current_bed.attending_doctor && (
                <Grid item xs={12} md={3}>
                  <Typography variant="body2">Attending Doctor</Typography>
                  <Typography variant="body1" fontWeight={theme.typography.fontWeightMedium}>{current_bed.attending_doctor}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Treatment History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={theme.typography.h6.fontWeight} color="primary">
            Treatment History
          </Typography>
          <Divider sx={{ mb: theme.spacing(2) }} />
          {treatments.length > 0 ? (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Diagnosis</TableCell>
                    <TableCell>Symptoms</TableCell>
                    <TableCell>Prescribed Medicines</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Follow-up</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {treatments.map((treatment) => (
                    <TableRow key={treatment.id} hover>
                      <TableCell>
                        {new Date(treatment.visit_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={theme.typography.fontWeightMedium}>{treatment.diagnosis}</Typography>
                      </TableCell>
                      <TableCell>{treatment.symptoms}</TableCell>
                      <TableCell>
                        {treatment.medicines_prescribed && Array.isArray(treatment.medicines_prescribed) && treatment.medicines_prescribed.length > 0 ? (
                          <Box>
                            {treatment.medicines_prescribed.map((med, idx) => (
                              <Chip
                                key={idx}
                                label={`${med.medicine_name || 'Medicine'} (${med.quantity})`}
                                size="small"
                                sx={{ mr: theme.spacing(0.5), mb: theme.spacing(0.5) }}
                                icon={<MedicationIcon />}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">None</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={theme.spacing(1)}>
                          <Typography>{treatment.doctor_name}</Typography>
                          <Chip
                            label={treatment.doctor_available ? 'Available' : 'Unavailable'}
                            size="small"
                            color={treatment.doctor_available ? 'success' : 'default'}
                            sx={{ 
                              height: 20, 
                              fontSize: '0.75rem',
                              fontWeight: theme.typography.fontWeightMedium
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {treatment.follow_up_date ? (
                          <Chip
                            label={new Date(treatment.follow_up_date).toLocaleDateString()}
                            color="warning"
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">None</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No treatment records found</Alert>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Box mt={theme.spacing(3)}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Note:</strong> This dashboard shows your complete medical history. 
            For any medical concerns, please visit the medical center. 
            If you notice any discrepancies in your records, contact the medical staff immediately.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default PatientDashboard;
