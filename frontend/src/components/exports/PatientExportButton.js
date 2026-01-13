import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  People as PeopleIcon,
  LocalHospital as TreatmentIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import apiService from '../../services/api';
import { handleExport } from '../../utils/exportUtils';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Export menu for Patient-related data
 */
const PatientExportButton = ({ patientId = null, sx }) => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportPatients = () => {
    handleExport(apiService.exportPatients, {}, setLoading, showSuccess, showError);
    handleClose();
  };

  const handleExportTreatments = () => {
    const params = patientId ? { patient_id: patientId } : {};
    handleExport(apiService.exportTreatments, params, setLoading, showSuccess, showError);
    handleClose();
  };

  const handleExportHighRisk = () => {
    handleExport(apiService.exportHighRiskPatients, {}, setLoading, showSuccess, showError);
    handleClose();
  };

  // Check if user is staff (not a patient/student)
  const isStaff = user?.user_type && !['student', 'employee'].includes(user.user_type);

  return (
    <>
      <Button
        variant="outlined"
        startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
        onClick={handleClick}
        disabled={loading}
        sx={sx}
      >
        Export
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {isStaff && (
          <MenuItem onClick={handleExportPatients}>
            <ListItemIcon>
              <PeopleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Patient List</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleExportTreatments}>
          <ListItemIcon>
            <TreatmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {patientId ? 'My Treatments' : 'All Treatments'}
          </ListItemText>
        </MenuItem>
        {isStaff && <Divider />}
        {isStaff && (
          <MenuItem onClick={handleExportHighRisk}>
            <ListItemIcon>
              <WarningIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>High-Risk Patients</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default PatientExportButton;
