import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import apiService from '../../services/api';
import { MedicineExportButton } from '../../components/exports';

const LowStock = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLowStockMedicines();
  }, []);

  useEffect(() => {
    // Filter medicines based on search term
    if (searchTerm.trim() === '') {
      setFilteredMedicines(medicines);
    } else {
      const filtered = medicines.filter(
        (medicine) =>
          medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMedicines(filtered);
    }
  }, [searchTerm, medicines]);

  const fetchLowStockMedicines = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLowStockMedicines();
      const data = response.data?.results || response.data || [];
      setMedicines(data);
      setFilteredMedicines(data);
      setError('');
    } catch (err) {
      console.error('Error fetching low stock medicines:', err);
      setError('Failed to load low stock medicines');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (medicine) => {
    if (medicine.current_stock === 0) return 'error';
    if (medicine.current_stock <= medicine.minimum_stock_level / 2) return 'error';
    return 'warning';
  };

  const getStockStatusLabel = (medicine) => {
    if (medicine.current_stock === 0) return 'Out of Stock';
    return 'Low Stock';
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={theme.spacing(3)}>
        <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
          Low Stock Alerts
        </Typography>
        <MedicineExportButton />
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: theme.spacing(3) }}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Grid container spacing={theme.spacing(3)} sx={{ mb: theme.spacing(3) }}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Low Stock Medicines
                  </Typography>
                  <Typography variant="h3" fontWeight={theme.typography.h3.fontWeight} color="warning.main">
                    {medicines.length}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Needs immediate attention
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Out of Stock
                  </Typography>
                  <Typography variant="h3" fontWeight={theme.typography.h3.fontWeight} color="error.main">
                    {medicines.filter(m => m.current_stock === 0).length}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Urgent restocking required
                  </Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by name, category, or manufacturer..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: theme.spacing(3) }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Medicines Table */}
      {filteredMedicines.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Medicine Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Manufacturer</TableCell>
                <TableCell>Current Stock</TableCell>
                <TableCell>Min Level</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMedicines.map((medicine) => (
                <TableRow 
                  key={medicine.id} 
                  hover
                  sx={{ 
                    bgcolor: medicine.current_stock === 0 ? 'error.lighter' : 'inherit',
                  }}
                >
                  <TableCell>
                    <Typography fontWeight={theme.typography.fontWeightMedium}>{medicine.name}</Typography>
                    {medicine.generic_name && (
                      <Typography variant="caption" color="textSecondary">
                        {medicine.generic_name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={medicine.category} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{medicine.manufacturer || '—'}</TableCell>
                  <TableCell>
                    <Typography 
                      fontWeight={theme.typography.fontWeightBold}
                      color={medicine.current_stock === 0 ? 'error.main' : 'warning.main'}
                    >
                      {medicine.current_stock} {medicine.unit}
                    </Typography>
                  </TableCell>
                  <TableCell>{medicine.minimum_stock_level}</TableCell>
                  <TableCell>₹{medicine.unit_price}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStockStatusLabel(medicine)}
                      size="small"
                      color={getStockStatusColor(medicine)}
                      icon={<WarningIcon />}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Card>
          <CardContent>
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center"
              py={theme.spacing(8)}
            >
              <InventoryIcon sx={{ fontSize: 80, color: 'success.main', opacity: 0.3, mb: theme.spacing(2) }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                {searchTerm ? 'No medicines found matching your search' : 'All medicines are adequately stocked'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchTerm ? 'Try a different search term' : 'Great job maintaining inventory levels!'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default LowStock;
