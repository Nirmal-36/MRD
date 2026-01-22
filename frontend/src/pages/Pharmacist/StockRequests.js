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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import apiService from '../../services/api';
import { MedicineExportButton } from '../../components/exports';

const StockRequests = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [actionNotes, setActionNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [tabValue, setTabValue] = useState(0); // 0=pending, 1=approved, 2=rejected, 3=all

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const statusMap = ['pending', 'approved', 'rejected', ''];
      const status = statusMap[tabValue];
      
      const params = status ? { status } : {};
      const response = await apiService.getStockRequests(params);
      
      setRequests(response.data?.results || response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load stock requests');
    } finally {
      setLoading(false);
    }
  };

  // console.log('Requests:', requests);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue]);

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleOpenActionDialog = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setActionNotes('');
    setExpiryDate('');
    setBatchNumber('');
    setActionDialogOpen(true);
  };

  const handleSubmitAction = async () => {
    try {
      if (actionType === 'approve') {
        // Validate expiry_date is required for approval
        if (!expiryDate) {
          setError('Expiry date is required when approving stock requests');
          return;
        }
        
        await apiService.approveStockRequest(selectedRequest.id, { 
          expiry_date: expiryDate,
          batch_number: batchNumber,
          notes: actionNotes 
        });
      } else {
        await apiService.rejectStockRequest(selectedRequest.id, { 
          reason: actionNotes 
        });
      }
      
      setSuccess(`Stock request ${actionType}d successfully`);
      setActionDialogOpen(false);
      setError('');
      fetchRequests();
    } catch (err) {
      console.error(`Error ${actionType}ing request:`, err);
      setError(err.response?.data?.error || `Failed to ${actionType} request`);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      case 'ordered': return 'info';
      case 'received': return 'success';
      default: return 'default';
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={theme.spacing(3)}>
        <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
          Stock Requests Management
        </Typography>
        <MedicineExportButton />
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

      {/* Tabs for filtering */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: theme.spacing(3) }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
          <Tab label="All Requests" />
        </Tabs>
      </Box>

      {/* Requests Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Medicine</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Current Stock</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Requested By</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length > 0 ? (
              requests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>
                    <Typography fontWeight={theme.typography.fontWeightMedium}>{request.medicine_name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={theme.typography.fontWeightBold} color="primary">
                      {request.requested_quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>{request.current_stock}</TableCell>
                  <TableCell>
                    <Chip
                      label={request.priority}
                      size="small"
                      color={getPriorityColor(request.priority)}
                    />
                  </TableCell>
                  <TableCell>{request.requested_by_name}</TableCell>
                  <TableCell>
                    {new Date(request.requested_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.status}
                      size="small"
                      color={getStatusColor(request.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={theme.spacing(1)}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewRequest(request)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {request.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleOpenActionDialog(request, 'approve')}
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenActionDialog(request, 'reject')}
                            >
                              <RejectIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary" py={theme.spacing(3)}>
                    No stock requests found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Stock Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: theme.spacing(2) }}>
              <Typography variant="subtitle2" color="textSecondary">Medicine</Typography>
              <Typography variant="body1" fontWeight={theme.typography.fontWeightBold} mb={theme.spacing(2)}>
                {selectedRequest.medicine_name}
              </Typography>

              <Typography variant="subtitle2" color="textSecondary">Requested Quantity</Typography>
              <Typography variant="body1" mb={theme.spacing(2)}>
                {selectedRequest.requested_quantity} units
              </Typography>

              <Typography variant="subtitle2" color="textSecondary">Current Stock</Typography>
              <Typography variant="body1" mb={theme.spacing(2)}>
                {selectedRequest.current_stock} units
              </Typography>

              <Typography variant="subtitle2" color="textSecondary">Priority</Typography>
              <Chip
                label={selectedRequest.priority}
                size="small"
                color={getPriorityColor(selectedRequest.priority)}
                sx={{ mb: theme.spacing(2) }}
              />

              <Typography variant="subtitle2" color="textSecondary" mt={theme.spacing(2)}>Reason</Typography>
              <Typography variant="body1" mb={theme.spacing(2)}>
                {selectedRequest.reason}
              </Typography>

              {selectedRequest.estimated_usage_days && (
                <>
                  <Typography variant="subtitle2" color="textSecondary">Estimated Usage</Typography>
                  <Typography variant="body1" mb={theme.spacing(2)}>
                    {selectedRequest.estimated_usage_days} days
                  </Typography>
                </>
              )}

              <Typography variant="subtitle2" color="textSecondary">Requested By</Typography>
              <Typography variant="body1" mb={theme.spacing(2)}>
                {selectedRequest.requested_by_name}
              </Typography>

              <Typography variant="subtitle2" color="textSecondary">Request Date</Typography>
              <Typography variant="body1" mb={theme.spacing(2)}>
                {new Date(selectedRequest.requested_date).toLocaleString()}
              </Typography>

              <Typography variant="subtitle2" color="textSecondary">Status</Typography>
              <Chip
                label={selectedRequest.status}
                size="small"
                color={getStatusColor(selectedRequest.status)}
              />

              {selectedRequest.notes && (
                <>
                  <Typography variant="subtitle2" color="textSecondary" mt={theme.spacing(2)}>Notes</Typography>
                  <Typography variant="body1">{selectedRequest.notes}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve' : 'Reject'} Stock Request
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: theme.spacing(2) }}>
            <Alert severity={actionType === 'approve' ? 'success' : 'warning'} sx={{ mb: theme.spacing(2) }}>
              <Typography variant="body2">
                <strong>Medicine:</strong> {selectedRequest?.medicine_name}<br />
                <strong>Quantity:</strong> {selectedRequest?.requested_quantity} units
              </Typography>
            </Alert>
            
            {actionType === 'approve' && (
              <>
                <Alert severity="info" sx={{ mb: theme.spacing(2) }}>
                  <Typography variant="body2">
                    <strong>⚠️ Required:</strong> You must provide the expiry date when approving stock requests.
                  </Typography>
                </Alert>
                
                <TextField
                  fullWidth
                  required
                  label="Expiry Date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: new Date().toISOString().split('T')[0], // Prevent past dates
                  }}
                  sx={{ mb: theme.spacing(2) }}
                  helperText="Medicine expiry date (required)"
                />
                
                <TextField
                  fullWidth
                  label="Batch Number"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  sx={{ mb: theme.spacing(2) }}
                  placeholder="e.g., BATCH2026001"
                  helperText="Batch identification number (optional but recommended)"
                />
              </>
            )}
            
            <TextField
              fullWidth
              label={actionType === 'approve' ? 'Notes (Optional)' : 'Rejection Reason'}
              multiline
              rows={4}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder={`Add notes for ${actionType}ing this request...`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitAction}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            disabled={actionType === 'approve' && !expiryDate}
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockRequests;
