import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Checkbox,
  Autocomplete,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PatientExportButton } from '../../components/exports';

const Treatments = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [treatments, setTreatments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]); // [{medicineId, quantity, dosage, duration}]
  const [prescribedMedicines, setPrescribedMedicines] = useState([]); // For viewing prescribed medicines
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  
  const [formData, setFormData] = useState({
    patient: '',
    visit_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    symptoms: '',
    diagnosis: '',
    treatment_given: '',
    severity: 'medium',
    follow_up_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [treatmentsRes, patientsRes, medicinesRes] = await Promise.all([
        apiService.getTreatments(),
        apiService.getPatients(),
        apiService.getMedicines(),
      ]);
      
      const treatmentData = treatmentsRes.data.results || treatmentsRes.data || [];
      const patientData = patientsRes.data.results || patientsRes.data || [];
      const medicineData = medicinesRes.data.results || medicinesRes.data || [];
      
      setTreatments(treatmentData);
      setPatients(patientData);
      
      const availableMedicines = medicineData.filter(m => 
        m.current_stock > 0 && 
        m.is_active !== false
      );
      setMedicines(availableMedicines);
      
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (treatment = null) => {
    if (treatment) {
      setSelectedTreatment(treatment);
      setFormData({
        patient: treatment.patient,
        visit_date: treatment.visit_date ? treatment.visit_date.substring(0, 16) : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        symptoms: treatment.symptoms,
        diagnosis: treatment.diagnosis,
        treatment_given: treatment.treatment_given,
        severity: treatment.severity,
        follow_up_date: treatment.follow_up_date || '',
        notes: treatment.notes || '',
      });
      setSelectedMedicines([]);
    } else {
      setSelectedTreatment(null);
      setFormData({
        patient: '',
        visit_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        symptoms: '',
        diagnosis: '',
        treatment_given: '',
        severity: 'medium',
        follow_up_date: '',
        notes: '',
      });
      setSelectedMedicines([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTreatment(null);
    setSelectedMedicines([]);
    setFormData({
      patient: '',
      visit_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      symptoms: '',
      diagnosis: '',
      treatment_given: '',
      severity: 'medium',
      follow_up_date: '',
      notes: '',
    });
    // Clear any error/success messages when closing dialog
    setError('');
    setSuccess('');
  };

  const handleMedicineQuantityChange = (medicineId, quantity) => {
    setSelectedMedicines(prev =>
      prev.map(m =>
        m.medicineId === medicineId
          ? { ...m, quantity: parseInt(quantity) || 1 }
          : m
      )
    );
  };

  const handleMedicineDosageChange = (medicineId, dosage) => {
    setSelectedMedicines(prev =>
      prev.map(m =>
        m.medicineId === medicineId
          ? { ...m, dosage }
          : m
      )
    );
  };

  const handleMedicineDurationChange = (medicineId, duration) => {
    setSelectedMedicines(prev =>
      prev.map(m =>
        m.medicineId === medicineId
          ? { ...m, duration_days: parseInt(duration) || 7 }
          : m
      )
    );
  };

  const handleViewTreatment = async (treatment) => {
    setSelectedTreatment(treatment);
    setViewDialog(true);
    
    // Fetch prescribed medicines for this treatment
    try {
      const response = await apiService.getTreatmentMedicines(treatment.id);
      // Backend returns {count: X, medicines: [...]}
      setPrescribedMedicines(response.data?.medicines || []);
    } catch (err) {
      console.error('Error fetching prescribed medicines:', err);
      setPrescribedMedicines([]);
    }
  };

  const handleSubmit = async () => {
    try {
      // Clear previous messages
      setError('');
      setSuccess('');
      
      const submitData = {
        ...formData,
        doctor: user.id,
        // Convert empty follow_up_date to null
        follow_up_date: formData.follow_up_date || null,
      };

      let treatmentId;
      let isUpdate = !!selectedTreatment;
      let treatmentCreated = false;
      
      if (selectedTreatment) {
        await apiService.updateTreatment(selectedTreatment.id, submitData);
        treatmentId = selectedTreatment.id;
      } else {
        const response = await apiService.createTreatment(submitData);
        treatmentId = response.data.id;
        treatmentCreated = true;
      }

      if (selectedMedicines.length > 0) {
        const failedMedicines = [];
        
        for (const med of selectedMedicines) {
          try {
            const prescriptionData = {
              medicine: med.medicineId,
              quantity: med.quantity,
              dosage: med.dosage,
              duration_days: med.duration_days
            };
            
            await apiService.prescribeMedicine(treatmentId, prescriptionData);
          } catch (medErr) {
            console.error('Error prescribing medicine:', medErr);
            const medicine = medicines.find(m => m.id === med.medicineId);
            const errorMessage = medErr.response?.data?.error || 
                                medErr.response?.data?.message || 
                                medErr.response?.data?.detail ||
                                'Failed to prescribe medicine';
            failedMedicines.push(`${medicine?.name}: ${errorMessage}`);
          }
        }
        
        // If any medicines failed to prescribe
        if (failedMedicines.length > 0) {
          const errorMsg = `Treatment ${treatmentCreated ? 'created' : 'updated'}, but failed to prescribe:\n${failedMedicines.join('\n')}`;
          setError(errorMsg);
          setTimeout(() => setError(''), 8000);
          
          // Refresh data and close dialog
          await fetchData();
          handleCloseDialog();
          return;
        }
      }

      handleCloseDialog();
      await fetchData();
      
      const successMsg = isUpdate 
        ? 'Treatment updated successfully' 
        : selectedMedicines.length > 0 
          ? `Treatment created and ${selectedMedicines.length} medicine(s) prescribed. Stock updated automatically.`
          : 'Treatment created successfully';
      
      setSuccess(successMsg);
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      console.error('Error saving treatment:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.message || 
                      err.response?.data?.error || 
                      err.response?.data?.message ||
                      'Failed to save treatment';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
      // Don't close dialog on error so user can fix and retry
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this treatment record?')) {
      try {
        await apiService.deleteTreatment(id);
        setSuccess('Treatment deleted successfully');
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error deleting treatment:', err);
        setError('Failed to delete treatment');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
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
          Treatment Records
        </Typography>
        <Box display="flex" gap={2}>
          <PatientExportButton />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            Add Treatment
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, whiteSpace: 'pre-line' }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Treatments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Patient</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Visit Date</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Diagnosis</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Severity</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Follow-up</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {treatments.length > 0 ? (
              treatments.map((treatment) => (
                <TableRow key={treatment.id} hover>
                  <TableCell>{treatment.id}</TableCell>
                  <TableCell>{treatment.patient_name}</TableCell>
                  <TableCell>
                    {treatment.visit_date ? format(new Date(treatment.visit_date), 'MMM dd, yyyy HH:mm') : 'N/A'}
                  </TableCell>
                  <TableCell>{treatment.diagnosis}</TableCell>
                  <TableCell>
                    <Chip
                      label={treatment.severity.toUpperCase()}
                      size="small"
                      color={getSeverityColor(treatment.severity)}
                    />
                  </TableCell>
                  <TableCell>
                    {treatment.follow_up_date ? format(new Date(treatment.follow_up_date), 'MMM dd, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="info"
                      onClick={() => handleViewTreatment(treatment)}
                      size="small"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(treatment)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(treatment.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary" py={3}>
                    No treatment records found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTreatment ? 'Edit Treatment Record' : 'Add New Treatment Record'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: theme.spacing(2) }}>
            <Grid container spacing={theme.spacing(2)}>
              {/* Patient Selection */}
              <Grid item xs={12}>
                <Autocomplete
                  fullWidth
                  options={patients}
                  getOptionLabel={(option) => {
                    const hasTreatment = treatments.some(t => t.patient === option.id || t.patient_id === option.id);
                    return `${option.name} - ${option.employee_student_id} (${option.patient_type})${hasTreatment ? ' - Has Treatment Records' : ''}`;
                  }}
                  value={patients.find(p => p.id === formData.patient) || null}
                  onChange={(event, newValue) => {
                    setFormData({ ...formData, patient: newValue ? newValue.id : '' });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search and Select Patient"
                      placeholder="Type patient name or ID..."
                      required
                      helperText="Search by name or employee/student ID"
                    />
                  )}
                  renderOption={(props, option) => {
                    const hasTreatment = treatments.some(t => t.patient === option.id || t.patient_id === option.id);
                    return (
                    <li {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {option.name}
                          </Typography>
                          {hasTreatment && (
                            <Chip 
                              label="Has Records" 
                              size="small" 
                              color="info"
                              sx={{ height: '20px', fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          ID: {option.employee_student_id} | {option.patient_type} | Age: {option.age} | Blood: {option.blood_group || 'N/A'}
                        </Typography>
                      </Box>
                    </li>
                    );
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Grid>

              {/* Visit Date & Time and Severity */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Visit Date & Time"
                  type="datetime-local"
                  value={formData.visit_date}
                  onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Severity"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  required
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </TextField>
              </Grid>

              {/* Symptoms */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Symptoms"
                  multiline
                  rows={3}
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  required
                  helperText="Describe the patient's symptoms in detail"
                />
              </Grid>

              {/* Diagnosis */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Diagnosis"
                  multiline
                  rows={2}
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  required
                  helperText="Medical diagnosis based on examination"
                />
              </Grid>

              {/* Treatment Given */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Treatment Given"
                  multiline
                  rows={2}
                  value={formData.treatment_given}
                  onChange={(e) => setFormData({ ...formData, treatment_given: e.target.value })}
                  required
                  helperText="Describe the treatment provided and advice given"
                />
              </Grid>

              {/* Follow-up Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Follow-up Date"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 
                    min: format(new Date(), 'yyyy-MM-dd')
                  }}
                  helperText="Leave blank if no follow-up required"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                {/* Empty space for layout */}
              </Grid>

              {/* Medicines Prescription */}
              <Grid item xs={12}>
                {medicines.length > 0 ? (
                  <>
                    <Autocomplete
                      multiple
                      options={medicines}
                      disableCloseOnSelect
                      getOptionLabel={(option) => `${option.name} (${option.generic_name})`}
                      value={medicines.filter(m => selectedMedicines.find(sm => sm.medicineId === m.id))}
                      onChange={(event, newValue) => {
                        const currentIds = selectedMedicines.map(m => m.medicineId);
                        const newIds = newValue.map(m => m.id);
                        
                        const addedMedicines = newIds.filter(id => !currentIds.includes(id));
                        const removedMedicines = currentIds.filter(id => !newIds.includes(id));
                        
                        let updatedMedicines = [...selectedMedicines];
                        
                        addedMedicines.forEach(id => {
                          updatedMedicines.push({
                            medicineId: id,
                            quantity: 1,
                            dosage: '',
                            duration_days: 7
                          });
                        });
                        
                        updatedMedicines = updatedMedicines.filter(m => !removedMedicines.includes(m.medicineId));
                        setSelectedMedicines(updatedMedicines);
                      }}
                      renderOption={(props, option, { selected }) => (
                        <li {...props}>
                          <Checkbox
                            checked={selected}
                            sx={{ mr: 2 }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {option.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {option.generic_name} | Category: {option.category} | Stock: {option.current_stock} {option.unit}
                            </Typography>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Search and Select Medicines"
                          placeholder="Type medicine name to search..."
                          helperText="Search and select medicines to prescribe. Stock will be automatically deducted upon saving."
                        />
                      )}
                    />
                    
                    {/* Display Selected Medicines with Details */}
                    {selectedMedicines.map((selectedMed, index) => {
                      const medicine = medicines.find(m => m.id === selectedMed.medicineId);
                      if (!medicine) return null;
                      
                      return (
                        <Box
                          key={medicine.id}
                          sx={{
                            mt: 2,
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: 'background.paper'
                          }}
                        >
                          <Grid container spacing={theme.spacing(2)} alignItems="center">
                            <Grid item xs={12}>
                              <Typography variant="body2" fontWeight="bold">
                                {index + 1}. {medicine.name} ({medicine.generic_name})
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Available Stock: {medicine.current_stock} {medicine.unit}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Quantity"
                                value={selectedMed.quantity}
                                onChange={(e) => handleMedicineQuantityChange(medicine.id, e.target.value)}
                                inputProps={{ min: 1, max: medicine.current_stock }}
                                size="small"
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Dosage Instructions"
                                value={selectedMed.dosage}
                                onChange={(e) => handleMedicineDosageChange(medicine.id, e.target.value)}
                                placeholder="e.g., 1 tablet twice daily."
                                size="small"
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Duration (days)"
                                value={selectedMed.duration_days}
                                onChange={(e) => handleMedicineDurationChange(medicine.id, e.target.value)}
                                inputProps={{ min: 1, max: 90 }}
                                size="small"
                                required
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      );
                    })}
                  </>
                ) : (
                  <Alert severity="warning">
                    No medicines available in stock. Please contact pharmacy.
                  </Alert>
                )}
              </Grid>

              {/* Additional Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Additional Notes"
                  multiline
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  helperText="Optional: Add any other relevant information"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedTreatment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => {
        setViewDialog(false);
        setPrescribedMedicines([]);
      }} maxWidth="md" fullWidth>
        <DialogTitle>Treatment Record Details</DialogTitle>
        <DialogContent>
          {selectedTreatment && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Patient</Typography>
                  <Typography variant="body1">{selectedTreatment.patient_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Visit Date</Typography>
                  <Typography variant="body1">
                    {selectedTreatment.visit_date ? format(new Date(selectedTreatment.visit_date), 'MMM dd, yyyy HH:mm') : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Severity</Typography>
                  <Chip
                    label={selectedTreatment.severity.toUpperCase()}
                    size="small"
                    color={getSeverityColor(selectedTreatment.severity)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Symptoms</Typography>
                  <Typography variant="body1">{selectedTreatment.symptoms}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Diagnosis</Typography>
                  <Typography variant="body1">{selectedTreatment.diagnosis}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Treatment Given</Typography>
                  <Typography variant="body1">{selectedTreatment.treatment_given}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>Medicines Prescribed</Typography>
                  {prescribedMedicines.length > 0 ? (
                    <Box>
                      {prescribedMedicines.map((prescription, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            mb: 1, 
                            p: 1.5, 
                            bgcolor: 'primary.50', 
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'primary.light'
                          }}
                        >
                          <Typography variant="body1" fontWeight={theme.typography.fontWeightBold} color="primary">
                            {prescription.medicine_name || prescription.medicine}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            <strong>Quantity:</strong> {prescription.quantity} • 
                            <strong> Dosage:</strong> {prescription.dosage || 'N/A'} • 
                            <strong> Duration:</strong> {prescription.duration_days} days
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body1" color="textSecondary">None prescribed</Typography>
                  )}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Follow-up Date</Typography>
                  <Typography variant="body1">
                    {selectedTreatment.follow_up_date ? format(new Date(selectedTreatment.follow_up_date), 'MMM dd, yyyy') : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Additional Notes</Typography>
                  <Typography variant="body1">{selectedTreatment.notes || 'None'}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewDialog(false);
            setPrescribedMedicines([]);
          }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Treatments;
