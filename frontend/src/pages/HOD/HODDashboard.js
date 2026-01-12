import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
} from '@mui/material';
import {
  School,
  LocalHospital,
  Warning,
  Inventory,
  Hotel,
  TrendingUp,
  People,
  Assessment,
  ArrowForward,
  Business,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const HODDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const department = user?.department;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [quickStats, setQuickStats] = useState({
    criticalStock: 0,
    highRiskStudents: 0,
    totalVisits: 0,
    bedOccupancy: 0,
  });

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line
  }, [department]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch main dashboard data
      const dashResponse = await apiService.getHODDashboard();
      setDashboardData(dashResponse.data);

      // Fetch quick stats from various endpoints (department-filtered)
      const params = department ? { department } : {};
      const [criticalStockRes, highRiskRes, utilizationRes, bedCapacityRes] = await Promise.all([
        apiService.getCriticalStock(params).catch(() => ({ data: { total_count: 0 } })),
        apiService.getHighRiskStudents(params).catch(() => ({ data: { total_count: 0 } })),
        apiService.getUtilizationRate({ ...params, months: 1 }).catch(() => ({ data: { total_visits: 0 } })),
        apiService.getBedCapacityReport(params).catch(() => ({ data: { occupancy_rate: 0 } })),
      ]);

      setQuickStats({
        criticalStock: criticalStockRes.data.total_count || 0,
        highRiskStudents: highRiskRes.data.total_count || 0,
        totalVisits: utilizationRes.data.total_visits || 0,
        bedOccupancy: bedCapacityRes.data.occupancy_rate || 0,
      });

      setError('');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: theme.spacing(4) }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" gutterBottom sx={{ 
              fontWeight: theme.typography.h4.fontWeight,
              color: 'primary.main'
            }}>
              HOD Dashboard
            </Typography>
            <Box display="flex" alignItems="center" gap={theme.spacing(1)}>
              <Typography variant="body1" color="text.secondary">
                Department-specific overview and key performance indicators
              </Typography>
              {department && (
                <Chip
                  icon={<Business />}
                  label={`Department: ${department}`}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Quick Stats Cards */}
      <Grid container spacing={theme.spacing(3)} sx={{ mb: theme.spacing(4) }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            color: theme.palette.primary.contrastText,
            height: '100%'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
                    {dashboardData?.total_students || 0}
                  </Typography>
                  <Typography variant="body2">Department Students</Typography>
                </Box>
                <School sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
            color: theme.palette.success.contrastText,
            height: '100%'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
                    {quickStats.totalVisits}
                  </Typography>
                  <Typography variant="body2">Monthly Visits</Typography>
                </Box>
                <LocalHospital sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
            color: theme.palette.warning.contrastText,
            height: '100%'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
                    {quickStats.criticalStock}
                  </Typography>
                  <Typography variant="body2">Critical Stock Items</Typography>
                </Box>
                <Warning sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
            color: theme.palette.info.contrastText,
            height: '100%'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
                    {quickStats.bedOccupancy}%
                  </Typography>
                  <Typography variant="body2">Bed Occupancy</Typography>
                </Box>
                <Hotel sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Department Overview */}
      <Grid container spacing={theme.spacing(3)} sx={{ mb: theme.spacing(4) }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: theme.spacing(3), height: '100%' }}>
            <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight} gutterBottom>
              <People sx={{ mr: theme.spacing(1), verticalAlign: 'middle', color: theme.palette.primary.main }} />
              Department Overview
            </Typography>
            <Grid container spacing={theme.spacing(2)} sx={{ mt: theme.spacing(1) }}>
              <Grid item xs={6}>
                <Box sx={{ p: theme.spacing(2), bgcolor: theme.palette.background.default, borderRadius: theme.shape.borderRadius }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Faculty
                  </Typography>
                  <Typography variant="h5" fontWeight={theme.typography.h5.fontWeight}>
                    {dashboardData?.total_faculty || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: theme.spacing(2), bgcolor: theme.palette.background.default, borderRadius: theme.shape.borderRadius }}>
                  <Typography variant="body2" color="text.secondary">
                    Support Staff
                  </Typography>
                  <Typography variant="h5" fontWeight={theme.typography.h5.fontWeight}>
                    {dashboardData?.total_staff || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: theme.spacing(2), bgcolor: theme.palette.background.default, borderRadius: theme.shape.borderRadius }}>
                  <Typography variant="body2" color="text.secondary">
                    Under Treatment
                  </Typography>
                  <Typography variant="h5" fontWeight={theme.typography.h5.fontWeight}>
                    {dashboardData?.under_treatment || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: theme.spacing(2), bgcolor: theme.palette.background.default, borderRadius: theme.shape.borderRadius }}>
                  <Typography variant="body2" color="text.secondary">
                    High-Risk Students
                  </Typography>
                  <Typography variant="h5" fontWeight={theme.typography.h5.fontWeight} color="error.main">
                    {quickStats.highRiskStudents}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: theme.spacing(3), height: '100%' }}>
            <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight} gutterBottom>
              <Assessment sx={{ mr: theme.spacing(1), verticalAlign: 'middle', color: theme.palette.primary.main }} />
              Medical Statistics
            </Typography>
            <Grid container spacing={theme.spacing(2)} sx={{ mt: theme.spacing(1) }}>
              <Grid item xs={6}>
                <Box sx={{ p: theme.spacing(2), bgcolor: theme.palette.background.default, borderRadius: theme.shape.borderRadius }}>
                  <Typography variant="body2" color="text.secondary">
                    Today's Visits
                  </Typography>
                  <Typography variant="h5" fontWeight={theme.typography.h5.fontWeight}>
                    {dashboardData?.today_visits || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: theme.spacing(2), bgcolor: theme.palette.background.default, borderRadius: theme.shape.borderRadius }}>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Visits
                  </Typography>
                  <Typography variant="h5" fontWeight={theme.typography.h5.fontWeight}>
                    {dashboardData?.monthly_visits || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: theme.spacing(2), bgcolor: theme.palette.background.default, borderRadius: theme.shape.borderRadius }}>
                  <Typography variant="body2" color="text.secondary">
                    Active Beds
                  </Typography>
                  <Typography variant="h5" fontWeight={theme.typography.h5.fontWeight}>
                    {dashboardData?.active_beds || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: theme.spacing(2), bgcolor: theme.palette.background.default, borderRadius: theme.shape.borderRadius }}>
                  <Typography variant="body2" color="text.secondary">
                    Available Beds
                  </Typography>
                  <Typography variant="h5" fontWeight={theme.typography.h5.fontWeight}>
                    {dashboardData?.available_beds || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Access Reports */}
      <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight} gutterBottom sx={{ mb: theme.spacing(2) }}>
        <TrendingUp sx={{ mr: theme.spacing(1), verticalAlign: 'middle', color: theme.palette.primary.main }} />
        Detailed Reports {department && `- ${department}`}
      </Typography>
      <Grid container spacing={theme.spacing(3)}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
          }}
          onClick={() => navigate('/hod/student-health')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={theme.spacing(2)}>
                <School sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                <ArrowForward sx={{ color: theme.palette.primary.main }} />
              </Box>
              <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>
                Student Health Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Department health trends
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
          }}
          onClick={() => navigate('/hod/high-risk')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={theme.spacing(2)}>
                <Warning sx={{ fontSize: 40, color: theme.palette.warning.main }} />
                <ArrowForward sx={{ color: theme.palette.warning.main }} />
              </Box>
              <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>
                High-Risk Students
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Department-specific monitoring
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
          }}
          onClick={() => navigate('/hod/utilization')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={theme.spacing(2)}>
                <TrendingUp sx={{ fontSize: 40, color: theme.palette.success.main }} />
                <ArrowForward sx={{ color: theme.palette.success.main }} />
              </Box>
              <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>
                Utilization Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Department resource usage
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
          }}
          onClick={() => navigate('/hod/inventory')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={theme.spacing(2)}>
                <Inventory sx={{ fontSize: 40, color: theme.palette.error.main }} />
                <ArrowForward sx={{ color: theme.palette.error.main }} />
              </Box>
              <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>
                Inventory Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Department stock alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
          }}
          onClick={() => navigate('/hod/beds')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={theme.spacing(2)}>
                <Hotel sx={{ fontSize: 40, color: theme.palette.success.main }} />
                <ArrowForward sx={{ color: theme.palette.success.main }} />
              </Box>
              <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>
                Bed Capacity Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Department bed status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HODDashboard;
