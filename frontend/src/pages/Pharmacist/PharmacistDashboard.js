import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  ShoppingCart as RequestIcon,
  TrendingUp as TrendingIcon,
  LocalHospital as MedicineIcon,
  PendingActions as PendingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

const PharmacistDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    totalMedicines: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    pendingRequests: 0,
    recentTransactions: [],
    pendingRequestsList: [],
    lowStockMedicines: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data with individual error handling
      let medicines = [];
      let lowStock = [];
      let requests = [];
      let transactions = [];

      try {
        const medicinesRes = await apiService.getMedicines();
        medicines = medicinesRes.data?.results || medicinesRes.data || [];
      } catch (err) {
        console.error('Error fetching medicines:', err);
      }

      try {
        const lowStockRes = await apiService.getLowStockMedicines();
        lowStock = lowStockRes.data?.results || lowStockRes.data || [];
      } catch (err) {
        console.error('Error fetching low stock:', err);
      }

      try {
        const requestsRes = await apiService.getStockRequests({ status: 'pending' });
        requests = requestsRes.data?.results || requestsRes.data || [];
      } catch (err) {
        console.error('Error fetching requests:', err);
      }

      try {
        const transactionsRes = await apiService.getMedicineTransactions({ limit: 5 });
        transactions = transactionsRes.data?.results || transactionsRes.data || [];
      } catch (err) {
        console.error('Error fetching transactions:', err);
      }

      setDashboardData({
        totalMedicines: medicines.length,
        lowStockCount: lowStock.length,
        outOfStockCount: medicines.filter(m => m.current_stock === 0).length,
        pendingRequests: requests.length,
        recentTransactions: transactions.slice(0, 5),
        pendingRequestsList: requests.slice(0, 5),
        lowStockMedicines: lowStock.slice(0, 5),
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight} mb={theme.spacing(3)}>
        Pharmacist Dashboard
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: theme.spacing(3) }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={theme.spacing(3)} sx={{ mb: theme.spacing(4) }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Medicines
                  </Typography>
                  <Typography variant="h3" fontWeight={theme.typography.h3.fontWeight}>
                    {dashboardData.totalMedicines}
                  </Typography>
                </Box>
                <MedicineIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Low Stock Alerts
                  </Typography>
                  <Typography variant="h3" fontWeight={theme.typography.h3.fontWeight} color="warning.main">
                    {dashboardData.lowStockCount}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Needs restocking
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Out of Stock
                  </Typography>
                  <Typography variant="h3" fontWeight={theme.typography.h3.fontWeight} color="error.main">
                    {dashboardData.outOfStockCount}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Urgent action needed
                  </Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Pending Requests
                  </Typography>
                  <Typography variant="h3" fontWeight={theme.typography.h3.fontWeight} color="info.main">
                    {dashboardData.pendingRequests}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Awaiting approval
                  </Typography>
                </Box>
                <PendingIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={theme.spacing(3)} sx={{ mb: theme.spacing(4) }}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight} mb={theme.spacing(2)}>
                Quick Actions
              </Typography>
              <Box display="flex" gap={theme.spacing(2)} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<RequestIcon />}
                  onClick={() => navigate('/pharmacist/stock-requests')}
                  color="primary"
                >
                  Review Stock Requests
                </Button>
                <Button
                  variant="contained"
                  startIcon={<InventoryIcon />}
                  onClick={() => navigate('/pharmacist/inventory')}
                  color="secondary"
                >
                  Manage Inventory
                </Button>
                <Button
                  variant="contained"
                  startIcon={<WarningIcon />}
                  onClick={() => navigate('/pharmacist/low-stock')}
                  color="warning"
                >
                  View Low Stock
                </Button>
                <Button
                  variant="contained"
                  startIcon={<TrendingIcon />}
                  onClick={() => navigate('/pharmacist/transactions')}
                  color="success"
                >
                  View Transactions
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Requests Section */}
      {dashboardData.pendingRequestsList.length > 0 && (
        <Grid container spacing={theme.spacing(3)} sx={{ mb: theme.spacing(4) }}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={theme.spacing(2)}>
                  <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>
                    Pending Stock Requests
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/pharmacist/stock-requests')}
                  >
                    View All
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Medicine</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Requested By</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.pendingRequestsList.map((request) => (
                        <TableRow key={request.id} hover>
                          <TableCell>{request.medicine_name}</TableCell>
                          <TableCell>{request.requested_quantity}</TableCell>
                          <TableCell>
                            <Chip
                              label={request.priority}
                              size="small"
                              color={
                                request.priority === 'urgent' ? 'error' :
                                request.priority === 'high' ? 'warning' :
                                'default'
                              }
                            />
                          </TableCell>
                          <TableCell>{request.requested_by_name}</TableCell>
                          <TableCell>
                            {new Date(request.requested_date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Low Stock Medicines */}
      {dashboardData.lowStockMedicines.length > 0 && (
        <Grid container spacing={theme.spacing(3)}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={theme.spacing(2)}>
                  <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>
                    Low Stock Medicines
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/pharmacist/low-stock')}
                  >
                    View All
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Medicine</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Current Stock</TableCell>
                        <TableCell>Min Level</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.lowStockMedicines.map((medicine) => (
                        <TableRow key={medicine.id} hover>
                          <TableCell>{medicine.name}</TableCell>
                          <TableCell>{medicine.category}</TableCell>
                          <TableCell>
                            <Typography
                              fontWeight={theme.typography.fontWeightBold}
                              color={medicine.current_stock === 0 ? 'error' : 'warning.main'}
                            >
                              {medicine.current_stock} {medicine.unit}
                            </Typography>
                          </TableCell>
                          <TableCell>{medicine.minimum_stock_level}</TableCell>
                          <TableCell>
                            <Chip
                              label={medicine.current_stock === 0 ? 'Out of Stock' : 'Low Stock'}
                              size="small"
                              color={medicine.current_stock === 0 ? 'error' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default PharmacistDashboard;
