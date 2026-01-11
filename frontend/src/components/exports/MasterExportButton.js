import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  People as PeopleIcon,
  LocalHospital as TreatmentIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  ErrorOutline as LowStockIcon,
  Schedule as ExpiringIcon,
  SwapHoriz as TransactionIcon,
  RequestQuote as RequestIcon,
  Hotel as BedIcon,
  PersonPin as CurrentPatientsIcon,
  Assignment as AllocationIcon,
  CleaningServices as CleaningIcon,
  Badge as StaffIcon,
  School as StudentIcon,
  Work as EmployeeIcon,
} from '@mui/icons-material';
import apiService from '../../services/api';
import { handleExport } from '../../utils/exportUtils';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Master Export Button - All export options in one organized menu
 * For Principal and Admin users
 */
const MasterExportButton = () => {
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

  const exportAction = (apiFunction, params = {}) => {
    handleExport(apiFunction, params, setLoading, showSuccess, showError);
    handleClose();
  };

  return (
    <>
      <Button
        variant="contained"
        color="inherit"
        size="large"
        startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
        onClick={handleClick}
        disabled={loading}
        sx={{ 
          minWidth: 160,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          color: 'success.main',
          fontWeight: 'bold',
          '&:hover': {
            bgcolor: 'white',
          }
        }}
      >
        Export Data
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxHeight: 500,
            width: 280,
          },
        }}
      >
        {/* Patient Data Section */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary">
            PATIENT DATA
          </Typography>
        </Box>
        <MenuItem onClick={() => exportAction(apiService.exportPatients)}>
          <ListItemIcon>
            <PeopleIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Patient List</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => exportAction(apiService.exportTreatments)}>
          <ListItemIcon>
            <TreatmentIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>All Treatments</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => exportAction(apiService.exportHighRiskPatients)}>
          <ListItemIcon>
            <WarningIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>High-Risk Patients</ListItemText>
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        {/* Medicine Inventory Section */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary">
            MEDICINE INVENTORY
          </Typography>
        </Box>
        <MenuItem onClick={() => exportAction(apiService.exportMedicineInventory)}>
          <ListItemIcon>
            <InventoryIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Full Inventory</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => exportAction(apiService.exportLowStockMedicines)}>
          <ListItemIcon>
            <LowStockIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Low Stock Alerts</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => exportAction(apiService.exportExpiringMedicines, { days: 90 })}>
          <ListItemIcon>
            <ExpiringIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Expiring Soon (90d)</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => exportAction(apiService.exportMedicineTransactions)}>
          <ListItemIcon>
            <TransactionIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>Transactions</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => exportAction(apiService.exportStockRequests)}>
          <ListItemIcon>
            <RequestIcon fontSize="small" color="secondary" />
          </ListItemIcon>
          <ListItemText>Stock Requests</ListItemText>
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        {/* Bed Management Section */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary">
            BED MANAGEMENT
          </Typography>
        </Box>
        <MenuItem onClick={() => exportAction(apiService.exportBedInventory)}>
          <ListItemIcon>
            <BedIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Bed Inventory</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => exportAction(apiService.exportCurrentPatients)}>
          <ListItemIcon>
            <CurrentPatientsIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Current Admissions</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => exportAction(apiService.exportBedAllocations)}>
          <ListItemIcon>
            <AllocationIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>Allocation History</ListItemText>
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        {/* Operations Section */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary">
            OPERATIONS & DIRECTORIES
          </Typography>
        </Box>
        <MenuItem onClick={() => exportAction(apiService.exportCleaningRecords)}>
          <ListItemIcon>
            <CleaningIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Cleaning Records</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => exportAction(apiService.exportStaffDirectory)}>
          <ListItemIcon>
            <StaffIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Staff Directory</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => exportAction(apiService.exportStudentDirectory)}>
          <ListItemIcon>
            <StudentIcon fontSize="small" color="secondary" />
          </ListItemIcon>
          <ListItemText>Student Directory</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => exportAction(apiService.exportEmployeeDirectory)}>
          <ListItemIcon>
            <EmployeeIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>Employee Directory</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default MasterExportButton;
