import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import apiService from '../../services/api';

const Transactions = () => {
  const theme = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    transaction_type: '',
    search: '',
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        ...filters,
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await apiService.getMedicineTransactions(params);
      
      if (response.data.results) {
        setTransactions(response.data.results);
        setTotalCount(response.data.count || response.data.results.length);
      } else {
        setTransactions(response.data);
        setTotalCount(response.data.length);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const getTransactionIcon = (type) => {
    return type === 'received' ? <AddIcon fontSize="small" /> : <RemoveIcon fontSize="small" />;
  };

  const getTransactionColor = (type) => {
    return type === 'received' ? 'success' : 'error';
  };

  const getTransactionLabel = (type) => {
    const labels = {
      'received': 'Received',
      'issued': 'Issued',
      'expired': 'Expired',
      'adjustment': 'Adjustment'
    };
    return labels[type] || type;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={theme.spacing(3)}>
        <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
          Medicine Transactions
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchTransactions} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: theme.spacing(3) }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: theme.spacing(3) }}>
        <CardContent>
          <Grid container spacing={theme.spacing(2)}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Search Medicine"
                variant="outlined"
                size="small"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by medicine name..."
              />
            </Grid>
            <Grid width="20%" item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                select
                label="Transaction Type"
                variant="outlined"
                size="small"
                value={filters.transaction_type}
                onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="received">Received</MenuItem>
                <MenuItem value="issued">Issued</MenuItem>
                <MenuItem value="expired">Expired/Discarded</MenuItem>
                <MenuItem value="adjustment">Stock Adjustment</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : transactions.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <Typography color="textSecondary">No transactions found</Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Medicine</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell align="right">Total Amount</TableCell>
                      <TableCell>Performed By</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id} hover>
                        <TableCell>
                          {new Date(transaction.transaction_date || transaction.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={theme.typography.fontWeightMedium}>
                            {transaction.medicine_name || transaction.medicine}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getTransactionIcon(transaction.transaction_type)}
                            label={getTransactionLabel(transaction.transaction_type)}
                            size="small"
                            color={getTransactionColor(transaction.transaction_type)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            fontWeight={theme.typography.fontWeightBold}
                            color={transaction.transaction_type === 'received' ? 'success.main' : 'error.main'}
                          >
                            {transaction.transaction_type === 'received' ? '+' : '-'}
                            {transaction.quantity} {transaction.unit || ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {transaction.unit_price ? `₹${parseFloat(transaction.unit_price).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {transaction.total_amount ? (
                            <Typography fontWeight={theme.typography.fontWeightMedium}>
                              ₹{parseFloat(transaction.total_amount).toFixed(2)}
                            </Typography>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {transaction.performed_by_name || transaction.performed_by || '-'}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {transaction.notes || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Transactions;
