import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Rating, Alert, CircularProgress, Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CleaningServices as CleaningIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import apiService from '../../services/api';
import { CleaningExportButton } from '../../components/exports';

const CleaningRecords = () => {
  const theme = useTheme();
  const [records, setRecords] = useState([]);
  const [staffSuggestions, setStaffSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    cleaner_name: '',
    cleaner_contact: '',
    cleaning_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    areas_cleaned: 'Medical room general cleaning',
    supplies_used: '',
    notes: '',
    quality_rating: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRecords();
    fetchStaffSuggestions();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCleaningRecords();
      // Handle both paginated and non-paginated responses
      const recordsData = response.data.results || response.data;
      setRecords(Array.isArray(recordsData) ? recordsData : []);
    } catch (err) {
      setError('Failed to load cleaning records');
      console.error(err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffSuggestions = async () => {
    try {
      const response = await apiService.getCleaningStaffSuggestions();
      setStaffSuggestions(response.data.registered_staff || []);
    } catch (err) {
      console.error('Failed to load staff suggestions:', err);
    }
  };

  const handleOpenDialog = (record = null) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        cleaner_name: record.cleaner_name || '',
        cleaner_contact: record.cleaner_contact || '',
        cleaning_date: record.cleaning_date || new Date().toISOString().split('T')[0],
        start_time: record.start_time || '',
        end_time: record.end_time || '',
        areas_cleaned: record.areas_cleaned || 'Medical room general cleaning',
        supplies_used: record.supplies_used || '',
        notes: record.notes || '',
        quality_rating: record.quality_rating || null
      });
    } else {
      setEditingRecord(null);
      setFormData({
        cleaner_name: '',
        cleaner_contact: '',
        cleaning_date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        areas_cleaned: 'Medical room general cleaning',
        supplies_used: '',
        notes: '',
        quality_rating: null
      });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRecord(null);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.cleaner_name.trim()) {
        setError('Cleaner name is required');
        return;
      }
      if (!formData.cleaning_date) {
        setError('Cleaning date is required');
        return;
      }
      if (!formData.areas_cleaned.trim()) {
        setError('Please specify what areas were cleaned');
        return;
      }

      // Validate times if both provided
      if (formData.start_time && formData.end_time) {
        if (formData.end_time <= formData.start_time) {
          setError('End time must be after start time');
          return;
        }
      }

      const payload = {
        ...formData,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        quality_rating: formData.quality_rating || null
      };

      console.log('Submitting cleaning record:', payload);

      if (editingRecord) {
        await apiService.updateCleaningRecord(editingRecord.id, payload);
        setSuccess('Cleaning record updated successfully');
      } else {
        await apiService.createCleaningRecord(payload);
        setSuccess('Cleaning record added successfully');
      }

      handleCloseDialog();
      fetchRecords();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving cleaning record:', err);
      console.error('Error response:', err.response?.data);
      
      // Better error handling
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          // Extract field-specific errors
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => {
              const msgArray = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${msgArray.join(', ')}`;
            })
            .join('\n');
          setError(errorMessages || 'Failed to save cleaning record');
        } else {
          setError(errorData.toString());
        }
      } else {
        setError(err.message || 'Failed to save cleaning record');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cleaning record?')) {
      return;
    }

    try {
      await apiService.deleteCleaningRecord(id);
      setSuccess('Cleaning record deleted successfully');
      fetchRecords();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete cleaning record');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString;
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: theme.spacing(3),
        flexDirection: { xs: 'column', sm: 'row' },
        gap: theme.spacing(2)
      }}>
          <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
            <CleaningIcon sx={{ mr: theme.spacing(1), verticalAlign: 'middle' }} />
            Cleaning Records
          </Typography>
          <Box sx={{ display: 'flex', gap: theme.spacing(2) }}>
            <CleaningExportButton />
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Cleaning Record
            </Button>
          </Box>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: theme.spacing(2) }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {error && !openDialog && (
          <Alert severity="error" sx={{ mb: theme.spacing(2) }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: theme.spacing(5) }}>
            <CircularProgress />
          </Box>
        ) : records.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: theme.spacing(5) }}>
              <CleaningIcon sx={{ fontSize: 80, color: theme.palette.primary.main, opacity: 0.3, mb: theme.spacing(2) }} />
              <Typography variant="h6" color="text.secondary">
                No cleaning records found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: theme.spacing(1) }}>
                Click "Add Cleaning Record" to record a cleaning session
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Cleaner</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Areas Cleaned</TableCell>
                  <TableCell>Quality</TableCell>
                  <TableCell>Recorded By</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="primary" />
                        {formatDate(record.cleaning_date)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {record.cleaner_name}
                        </Typography>
                        {record.cleaner_contact && (
                          <Typography variant="caption" color="text.secondary">
                            {record.cleaner_contact}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {record.start_time && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatTime(record.start_time)} - {formatTime(record.end_time)}
                          </Typography>
                        </Box>
                      )}
                      {!record.start_time && '-'}
                    </TableCell>
                    <TableCell>
                      {record.duration_display || '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {record.areas_cleaned}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {record.quality_rating ? (
                        <Rating value={record.quality_rating} readOnly size="small" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{record.recorded_by_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.recorded_by_display_id}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(record)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(record.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingRecord ? 'Edit Cleaning Record' : 'Add Cleaning Record'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              {error && (
                <Alert severity="error" sx={{ mb: theme.spacing(2) }}>
                  {error}
                </Alert>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    options={staffSuggestions}
                    getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                    value={staffSuggestions.find(s => s.name === formData.cleaner_name) || formData.cleaner_name}
                    onChange={(event, newValue) => {
                      if (typeof newValue === 'object' && newValue !== null) {
                        // Selected from dropdown
                        setFormData(prev => ({
                          ...prev,
                          cleaner_name: newValue.name,
                          cleaner_contact: newValue.contact_number || ''
                        }));
                      } else {
                        // Typed custom name
                        setFormData(prev => ({
                          ...prev,
                          cleaner_name: newValue || ''
                        }));
                      }
                    }}
                    onInputChange={(event, newInputValue) => {
                      if (event?.type === 'change') {
                        setFormData(prev => ({
                          ...prev,
                          cleaner_name: newInputValue
                        }));
                      }
                    }}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {option.name}
                          </Typography>
                          {option.contact_number && (
                            <Typography variant="caption" color="text.secondary">
                              {option.contact_number}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select or Please Enter Cleaner's Full Name *"
                        fullWidth
                        required
                        helperText="Select from existing staff or type a new name (will be saved for future use)"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cleaner Contact"
                    name="cleaner_contact"
                    value={formData.cleaner_contact}
                    onChange={handleInputChange}
                    placeholder="Optional phone number"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Cleaning Date *"
                    name="cleaning_date"
                    type="date"
                    value={formData.cleaning_date}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    inputProps={{ max: new Date().toISOString().split('T')[0] }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    name="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="End Time"
                    name="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Areas Cleaned *"
                    name="areas_cleaned"
                    multiline
                    rows={2}
                    value={formData.areas_cleaned}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Medical room, beds, floors, bathrooms, examination tables"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Supplies Used"
                    name="supplies_used"
                    multiline
                    rows={2}
                    value={formData.supplies_used}
                    onChange={handleInputChange}
                    placeholder="e.g., Disinfectant, floor cleaner, glass cleaner"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    name="notes"
                    multiline
                    rows={2}
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional observations or comments"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography component="legend">Quality Rating (Optional)</Typography>
                  <Rating
                    name="quality_rating"
                    value={formData.quality_rating}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({
                        ...prev,
                        quality_rating: newValue
                      }));
                    }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {editingRecord ? 'Update' : 'Add'} Record
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
  );
};

export default CleaningRecords;
