import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Alert,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, MenuItem, IconButton, Tooltip, Grid,
  CircularProgress, useTheme
} from '@mui/material';
import { 
  Search as SearchIcon, 
  LocalPharmacy as PharmacyIcon,
  ShoppingCart as RequestIcon,
} from '@mui/icons-material';
import apiService from '../../services/api';
import { MedicineExportButton } from '../../components/exports';

const Medicines = () => {
  const theme = useTheme();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stock Request Dialog State
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [requestForm, setRequestForm] = useState({
    requested_quantity: '',
    priority: 'medium',
    reason: '',
    estimated_usage_days: '',
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMedicines();
      setMedicines(response.data.results || response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRequestDialog = (medicine) => {
    setSelectedMedicine(medicine);
    setRequestForm({
      requested_quantity: '',
      priority: medicine.current_stock === 0 ? 'urgent' : 
                medicine.current_stock <= medicine.minimum_stock_level ? 'high' : 'medium',
      reason: '',
      estimated_usage_days: '',
    });
    setRequestDialogOpen(true);
  };

  const handleCloseRequestDialog = () => {
    setRequestDialogOpen(false);
    setSelectedMedicine(null);
    setRequestForm({
      requested_quantity: '',
      priority: 'medium',
      reason: '',
      estimated_usage_days: '',
    });
  };

  const handleRequestFormChange = (field, value) => {
    setRequestForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitRequest = async () => {
    try {
      const requestData = {
        medicine: selectedMedicine.id,
        requested_quantity: parseInt(requestForm.requested_quantity),
        current_stock: selectedMedicine.current_stock,
        priority: requestForm.priority,
        reason: requestForm.reason,
        estimated_usage_days: requestForm.estimated_usage_days ? parseInt(requestForm.estimated_usage_days) : null,
      };

      await apiService.createStockRequest(requestData);
      setSuccess(`Stock request submitted successfully for ${selectedMedicine.name}`);
      handleCloseRequestDialog();
      fetchMedicines(); // Refresh the list
    } catch (err) {
      console.error('Error submitting stock request:', err);
      setError(err.response?.data?.error || 'Failed to submit stock request');
    }
  };

  const getStockStatus = (currentStock, minStock) => {
    if (currentStock === 0) return { label: 'Out of Stock', color: 'error' };
    if (currentStock <= minStock) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
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
          Medicine Inventory
        </Typography>
        <MedicineExportButton />
      </Box>

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

      {/* Low Stock Alert */}
      {medicines.filter(m => m.quantity <= m.minimum_stock_level && m.quantity > 0).length > 0 && (
        <Alert severity="warning" sx={{ mb: theme.spacing(2) }}>
          <Typography variant="body2">
            <strong>Warning:</strong> {medicines.filter(m => m.quantity <= m.minimum_stock_level && m.quantity > 0).length} medicine(s) have low stock levels!
          </Typography>
        </Alert>
      )}

      {/* Out of Stock Alert */}
      {medicines.filter(m => m.quantity === 0).length > 0 && (
        <Alert severity="error" sx={{ mb: theme.spacing(2) }}>
          <Typography variant="body2">
            <strong>Alert:</strong> {medicines.filter(m => m.quantity === 0).length} medicine(s) are out of stock!
          </Typography>
        </Alert>
      )}

      {/* Search Bar */}
      <Card sx={{ mb: theme.spacing(3) }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by name, category, or manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Statistics */}
      <Box display="flex" gap={theme.spacing(2)} mb={theme.spacing(3)}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={theme.spacing(2)}>
              <PharmacyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Total Medicines
                </Typography>
                <Typography variant="h5" fontWeight={theme.typography.h5.fontWeight}>
                  {medicines.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={theme.spacing(2)}>
              <PharmacyIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              <Box>
                                <Typography variant="body2" color="textSecondary">
                  Low Stock
                </Typography>
                <Typography variant="h5" fontWeight={theme.typography.h5.fontWeight}>
                  {medicines.filter(m => m.current_stock > 0 && m.current_stock <= m.minimum_stock_level).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={theme.spacing(2)}>
              <PharmacyIcon sx={{ fontSize: 40, color: 'error.main' }} />
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Out of Stock
                </Typography>
                <Typography variant="h5" fontWeight={theme.typography.h5.fontWeight}>
                  {medicines.filter(m => m.current_stock === 0).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Medicines Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Manufacturer</TableCell>
              <TableCell>Available Stock</TableCell>
              <TableCell>Unit Price</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMedicines.length > 0 ? (
              filteredMedicines.map((medicine) => {
                const stockStatus = getStockStatus(medicine.current_stock, medicine.minimum_stock_level);
                return (
                  <TableRow key={medicine.id} hover>
                    <TableCell>
                      <Typography fontWeight={theme.typography.fontWeightBold}>{medicine.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {medicine.generic_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{medicine.category}</TableCell>
                    <TableCell>{medicine.manufacturer}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography fontWeight={theme.typography.fontWeightBold}>
                          {medicine.current_stock} {medicine.unit}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Min: {medicine.minimum_stock_level}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>${medicine.unit_price}</TableCell>
                    <TableCell>
                      {medicine.expiry_date || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={stockStatus.label}
                        size="small"
                        color={stockStatus.color}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Request Stock">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenRequestDialog(medicine)}
                        >
                          <RequestIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary" py={theme.spacing(3)}>
                    No medicines found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Info Box */}
      <Box mt={3}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Note:</strong> Medicine inventory is managed by the pharmacy staff. 
            For prescriptions, please add them in the Treatment section.
          </Typography>
        </Alert>
      </Box>

      {/* Stock Request Dialog */}
      <Dialog 
        open={requestDialogOpen} 
        onClose={handleCloseRequestDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Request Stock Replenishment
          {selectedMedicine && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Medicine: {selectedMedicine.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedMedicine && (
            <Box sx={{ mb: theme.spacing(2), p: theme.spacing(2), bgcolor: 'grey.100', borderRadius: 1 }}>
              <Grid container spacing={theme.spacing(2)}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Current Stock</Typography>
                  <Typography variant="body1" fontWeight={theme.typography.fontWeightBold}>
                    {selectedMedicine.current_stock} {selectedMedicine.unit}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Minimum Level</Typography>
                  <Typography variant="body1" fontWeight={theme.typography.fontWeightBold}>
                    {selectedMedicine.minimum_stock_level} {selectedMedicine.unit}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <TextField
            fullWidth
            label="Requested Quantity"
            type="number"
            value={requestForm.requested_quantity}
            onChange={(e) => handleRequestFormChange('requested_quantity', e.target.value)}
            required
            sx={{ mb: theme.spacing(2) }}
            InputProps={{ inputProps: { min: 1 } }}
            helperText="Enter the quantity you need"
          />

          <TextField
            fullWidth
            select
            label="Priority"
            value={requestForm.priority}
            onChange={(e) => handleRequestFormChange('priority', e.target.value)}
            required
            sx={{ mb: 2 }}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label="Reason for Request"
            multiline
            rows={3}
            value={requestForm.reason}
            onChange={(e) => handleRequestFormChange('reason', e.target.value)}
            required
            sx={{ mb: 2 }}
            placeholder="Explain why this stock is needed..."
          />

          <TextField
            fullWidth
            label="Estimated Usage Days (Optional)"
            type="number"
            value={requestForm.estimated_usage_days}
            onChange={(e) => handleRequestFormChange('estimated_usage_days', e.target.value)}
            InputProps={{ inputProps: { min: 1 } }}
            helperText="How many days will this stock last?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRequestDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitRequest}
            variant="contained"
            disabled={!requestForm.requested_quantity || !requestForm.reason}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Medicines;
