import React, { useState, useEffect } from 'react';
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
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Autocomplete,
  useTheme,
} from '@mui/material';
import { 
  Hotel as BedIcon, 
  CheckCircle, 
  Cancel,
  PersonAdd as AllocateIcon,
  ExitToApp as DischargeIcon,
} from '@mui/icons-material';
import apiService from '../../services/api';
import { BedExportButton } from '../../components/exports';

const Beds = () => {
  const theme = useTheme();
  const [bedsData, setBedsData] = useState({ total_beds: 0, available_beds: 0, occupied_beds: 0 });
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]); // Add patients state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Allocation Dialog State
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null); // Add selected patient state
  const [allocationForm, setAllocationForm] = useState({
    patient_name: '',
    patient_id: '',
    admission_date: new Date().toISOString().split('T')[0],
    expected_discharge_date: '',
    condition: '',
    special_requirements: '',
    attending_doctor: localStorage.getItem('userId') || '',
  });
  
  // Discharge Dialog State
  const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [dischargeForm, setDischargeForm] = useState({
    discharge_notes: '',
    actual_discharge_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchBeds();
  }, []);

  const fetchBeds = async () => {
    try {
      setLoading(true);
      const [analyticsRes, bedsRes, patientsRes] = await Promise.all([
        apiService.getBeds(),
        apiService.getBeds(),
        apiService.getPatients(), // Fetch patients list
      ]);
      
      // Try to get analytics data
      let analytics = { total_beds: 0, available_beds: 0, occupied_beds: 0 };
      if (analyticsRes.data.summary) {
        analytics = analyticsRes.data.summary;
      }
      
      // Get beds list
      let bedsList = [];
      if (Array.isArray(bedsRes.data)) {
        bedsList = bedsRes.data;
      } else if (bedsRes.data.results) {
        bedsList = bedsRes.data.results;
      }
      
      // Get patients list
      const patientsList = patientsRes.data.results || patientsRes.data || [];
      setPatients(patientsList);
      
      // Calculate analytics from beds list if not available
      if (bedsList.length > 0 && analytics.total_beds === 0) {
        analytics.total_beds = bedsList.filter(bed => bed.is_active).length;
        analytics.available_beds = bedsList.filter(bed => bed.status === 'available' && bed.is_active).length;
        analytics.occupied_beds = bedsList.filter(bed => bed.status === 'occupied' && bed.is_active).length;
      }
      
      setBedsData(analytics);
      setBeds(bedsList);
      setError('');
    } catch (err) {
      console.error('Error fetching beds:', err);
      setError('Failed to load beds data');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateBed = (bed) => {
    setSelectedBed(bed);
    
    // Get current user from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = userData.id || '';
    
    setAllocationForm({
      patient_name: '',
      patient_id: '',
      admission_date: new Date().toISOString().split('T')[0],
      expected_discharge_date: '',
      condition: '',
      special_requirements: '',
      attending_doctor: userId,
    });
    setAllocationDialogOpen(true);
  };

  const handleSubmitAllocation = async () => {
    try {
      // Prepare allocation data
      const allocationData = {
        bed: selectedBed.id,
        patient_name: allocationForm.patient_name,
        patient_id: allocationForm.patient_id,
        admission_date: new Date(allocationForm.admission_date).toISOString(),
        condition: allocationForm.condition,
        special_requirements: allocationForm.special_requirements,
        attending_doctor: allocationForm.attending_doctor,
      };
      
      if (allocationForm.expected_discharge_date) {
        allocationData.expected_discharge_date = allocationForm.expected_discharge_date;
      }
      
      await apiService.createBedAllocation(allocationData);
      setSuccess(`Bed ${selectedBed.bed_number} successfully allocated to ${allocationForm.patient_name}`);
      setAllocationDialogOpen(false);
      setSelectedPatient(null);
      await fetchBeds();
      setError('');
    } catch (err) {
      console.error('Error allocating bed:', err);
      console.error('Error response:', err.response?.data);
      alert(JSON.stringify(error.response?.data, null, 2));

      
      // Extract error message from various possible response formats
      let errorMessage = 'Failed to allocate bed';
      if (err.response?.data) {
        const data = err.response.data;
        if (data.error) {
          errorMessage = data.error;
        } else if (data.bed) {
          errorMessage = Array.isArray(data.bed) ? data.bed[0] : data.bed;
        } else if (data.attending_doctor) {
          errorMessage = Array.isArray(data.attending_doctor) ? data.attending_doctor[0] : data.attending_doctor;
        } else if (data.patient_name) {
          errorMessage = Array.isArray(data.patient_name) ? data.patient_name[0] : data.patient_name;
        } else if (data.patient_id) {
          errorMessage = Array.isArray(data.patient_id) ? data.patient_id[0] : data.patient_id;
        } else if (data.condition) {
          errorMessage = Array.isArray(data.condition) ? data.condition[0] : data.condition;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.detail) {
          errorMessage = data.detail;
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleCloseAllocationDialog = () => {
    setAllocationDialogOpen(false);
    setSelectedPatient(null); // Clear selected patient when closing
  };

  const handleDischargeBed = (bed) => {
    // Use the current_allocation_id from the bed data
    const allocation = {
      id: bed.current_allocation_id,
      patient_name: bed.current_patient?.name,
      admission_date: bed.current_patient?.admission_date,
    };
    
    setSelectedBed(bed);
    setSelectedAllocation(allocation);
    setDischargeForm({ 
      discharge_notes: '',
      actual_discharge_date: new Date().toISOString().split('T')[0],
    });
    setDischargeDialogOpen(true);
  };

  const handleSubmitDischarge = async () => {
    try {
      const dischargeData = {
        discharge_notes: dischargeForm.discharge_notes,
        actual_discharge_date: new Date(dischargeForm.actual_discharge_date).toISOString(),
      };
      
      await apiService.dischargeBedAllocation(selectedAllocation.id, dischargeData);
      setSuccess(`Patient ${selectedAllocation.patient_name || selectedBed.current_patient?.name} successfully discharged from Bed ${selectedBed.bed_number}`);
      setDischargeDialogOpen(false);
      fetchBeds(); // Refresh the bed list
      
      // Clear error if any
      setError('');
    } catch (err) {
      console.error('Error discharging patient:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to discharge patient');
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={theme.spacing(3)}>
        <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
          Bed Management
        </Typography>
        <BedExportButton />
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

      {/* Statistics */}
      <Box sx={{ display: 'flex', gap: theme.spacing(3), mb: theme.spacing(3), flexWrap: 'wrap' }}>
        <Box sx={{ flex: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Beds
                  </Typography>
                  <Typography variant="h3" fontWeight={theme.typography.h3.fontWeight}>
                    {bedsData.total_beds}
                  </Typography>
                  {/* <Typography variant="caption" color="textSecondary">
                    {bedsData.total_beds > 0 
                      ? `${Math.round((bedsData.occupied_beds / bedsData.total_beds) * 100)}% utilization`
                      : '0% utilization'}
                  </Typography> */}
                </Box>
                <BedIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Occupied Beds
                  </Typography>
                  <Typography variant="h3" fontWeight={theme.typography.h3.fontWeight} color="error.main">
                    {bedsData.occupied_beds}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {bedsData.total_beds > 0 
                      ? `${Math.round((bedsData.occupied_beds / bedsData.total_beds) * 100)}% utilization`
                      : '0% utilization'}
                  </Typography>
                </Box>
                <BedIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Available Beds
                  </Typography>
                  <Typography variant="h3" fontWeight={theme.typography.h3.fontWeight} color="success.main">
                    {bedsData.available_beds}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Ready for admission
                  </Typography>
                </Box>
                <BedIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Beds Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Bed Number</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Equipment</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Patient</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Condition</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Special Requirements</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {beds.length > 0 ? (
              beds.filter(bed => bed.is_active).map((bed) => (
                <TableRow key={bed.id} hover>
                  <TableCell>
                    <Typography fontWeight={theme.typography.fontWeightBold}>{bed.bed_number}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={bed.status === 'available' ? 'Available' : 'Occupied'}
                      size="small"
                      color={bed.status === 'available' ? 'success' : 'error'}
                      icon={bed.status === 'available' ? <CheckCircle /> : <Cancel />}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={theme.spacing(0.5)} flexWrap="wrap">
                      {bed.has_oxygen && (
                        <Chip label="Oxygen" size="small" color="info" variant="outlined" />
                      )}
                      {bed.has_monitor && (
                        <Chip label="Monitor" size="small" color="info" variant="outlined" />
                      )}
                      {bed.has_ventilator && (
                        <Chip label="Ventilator" size="small" color="info" variant="outlined" />
                      )}
                      {!bed.has_oxygen && !bed.has_monitor && !bed.has_ventilator && (
                        <Typography variant="caption" color="textSecondary">None</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {bed.current_patient ? (
                      <Box>
                        <Typography fontWeight={theme.typography.fontWeightBold}>{bed.current_patient.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {bed.current_patient.patient_id}
                        </Typography>
                      </Box>
                    ) : bed.status === 'occupied' ? (
                      <Typography color="textSecondary">Occupied (Check allocations)</Typography>
                    ) : (
                      <Typography color="textSecondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {bed.current_patient?.condition || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {bed.current_patient?.special_requirements || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {bed.status === 'available' ? (
                        <Tooltip title="Allocate Bed">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleAllocateBed(bed)}
                          >
                            <AllocateIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Discharge Patient">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDischargeBed(bed)}
                          >
                            <DischargeIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary" py={3}>
                    No beds data available. Please ask admin to add beds to the system.
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
            <strong>Note:</strong> Use the action buttons to allocate available beds or discharge patients. 
            Click the <AllocateIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} /> icon to allocate a bed, 
            or <DischargeIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} /> icon to discharge a patient.
          </Typography>
        </Alert>
      </Box>

      {/* Bed Allocation Dialog */}
      <Dialog open={allocationDialogOpen} onClose={handleCloseAllocationDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Allocate Bed {selectedBed?.bed_number}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              options={patients}
              getOptionLabel={(option) => 
                `${option.name} (ID: ${option.employee_student_id}) - ${option.patient_type}`
              }
              value={selectedPatient}
              onChange={(event, newValue) => {
                setSelectedPatient(newValue);
                setAllocationForm({
                  ...allocationForm,
                  patient_name: newValue?.name || '',
                  patient_id: newValue?.employee_student_id || ''
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Patient"
                  required
                  placeholder="Search patient by name or ID"
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {option.employee_student_id} | Type: {option.patient_type}
                      </Typography>
                    </Box>
                  </li>
                );
              }}
              fullWidth
            />
            <TextField
              label="Admission Date"
              type="date"
              value={allocationForm.admission_date}
              onChange={(e) => setAllocationForm({ ...allocationForm, admission_date: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
            />
            <TextField
              label="Expected Discharge Date"
              type="date"
              value={allocationForm.expected_discharge_date}
              onChange={(e) => setAllocationForm({ ...allocationForm, expected_discharge_date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: allocationForm.admission_date || new Date().toISOString().split('T')[0] }}
            />
            <TextField
              label="Condition"
              value={allocationForm.condition}
              onChange={(e) => setAllocationForm({ ...allocationForm, condition: e.target.value })}
              required
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Special Requirements"
              value={allocationForm.special_requirements}
              onChange={(e) => setAllocationForm({ ...allocationForm, special_requirements: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAllocationDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitAllocation} 
            variant="contained" 
            disabled={!allocationForm.patient_name || !allocationForm.patient_id || !allocationForm.condition}
          >
            Allocate Bed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Discharge Dialog */}
      <Dialog open={dischargeDialogOpen} onClose={() => setDischargeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Discharge Patient from Bed {selectedBed?.bed_number}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Patient:</strong> {selectedAllocation?.patient_name || selectedBed?.current_patient?.name}
                <br />
                This action will mark the bed as available.
              </Typography>
            </Alert>
            <TextField
              label="Discharge Date"
              type="date"
              value={dischargeForm.actual_discharge_date}
              onChange={(e) => setDischargeForm({ ...dischargeForm, actual_discharge_date: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ 
                min: selectedAllocation?.admission_date?.split('T')[0] || new Date().toISOString().split('T')[0],
                max: new Date().toISOString().split('T')[0]
              }}
              helperText="Discharge date must be between admission date and today"
            />
            <TextField
              label="Discharge Notes"
              value={dischargeForm.discharge_notes}
              onChange={(e) => setDischargeForm({ ...dischargeForm, discharge_notes: e.target.value })}
              multiline
              rows={4}
              fullWidth
              placeholder="Enter discharge summary and instructions..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDischargeDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitDischarge} 
            variant="contained" 
            color="error"
            disabled={!dischargeForm.actual_discharge_date}
          >
            Discharge Patient
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Beds;
