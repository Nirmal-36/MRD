import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalHospital as TreatmentIcon,
  Hotel as BedIcon,
  CalendarToday as ScheduleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import apiService from '../../services/api';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [todayTreatments, setTodayTreatments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics
      const dashboardResponse = await apiService.getDashboard();
      setDashboardData(dashboardResponse.data);

      // Fetch today's treatments
      const treatmentsResponse = await apiService.getTodayTreatments();
      setTodayTreatments(treatmentsResponse.data.results || treatmentsResponse.data || []);

      setError('');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: { xs: 2, sm: 3 }, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom 
          fontWeight={theme.typography.h4.fontWeight} 
          sx={{ 
            color: "primary.contrastText",
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          }}
        >
          Doctor Dashboard
        </Typography>
        <Typography 
          variant="h6"
          sx={{ 
            opacity: 0.9, 
            color: "primary.contrastText",
            fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
          }}
        >
            Welcome back! Here's your overview for today
        </Typography>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Patients
                  </Typography>
                  <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
                    {dashboardData?.patients?.total || 0}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Today's Treatments
                  </Typography>
                  <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
                    {dashboardData?.treatments?.today || 0}
                  </Typography>
                </Box>
                <TreatmentIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Available Beds
                  </Typography>
                  <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
                    {dashboardData?.beds?.available || 0}
                  </Typography>
                </Box>
                <BedIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Pending Follow-ups
                  </Typography>
                  <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
                    {dashboardData?.treatments?.pending_follow_ups || 0}
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" gutterBottom sx={{ mb: theme.spacing(2) }}>
        Quick Actions
      </Typography>
      <Grid container spacing={theme.spacing(2)} sx={{ mb: theme.spacing(3) }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/doctor/patients')}
            sx={{ py: theme.spacing(2) }}
          >
            Manage Patients
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate('/doctor/treatments')}
            sx={{ py: theme.spacing(2) }}
          >
            View Treatments
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<BedIcon />}
            onClick={() => navigate('/doctor/beds')}
            sx={{ py: theme.spacing(2) }}
          >
            Bed Management
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<TreatmentIcon />}
            onClick={() => navigate('/doctor/medicines')}
            sx={{ py: theme.spacing(2) }}
          >
            View Medicines
          </Button>
        </Grid>
      </Grid>

      {/* Today's Treatments */}
      <Typography variant="h6" gutterBottom sx={{ mb: theme.spacing(2) }}>
        Today's Treatments
      </Typography>
      <Card>
        <CardContent>
          {todayTreatments.length > 0 ? (
            <Box>
              {todayTreatments.map((treatment) => (
                <Box
                  key={treatment.id}
                  sx={{
                    p: theme.spacing(2),
                    mb: theme.spacing(1),
                    borderLeft: 3,
                    borderColor: 'primary.main',
                    bgcolor: 'background.default',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={theme.typography.fontWeightBold}>
                    {treatment.patient_name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Diagnosis: {treatment.diagnosis}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Severity: {treatment.severity}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="textSecondary" textAlign="center" py={theme.spacing(3)}>
              No treatments scheduled for today
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DoctorDashboard;
