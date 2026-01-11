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
 * Export menu for Cleaning Records and User Directories
 */
const OtherExportButton = ({ cleaningFilters = {}, showCleaning = true, showDirectories = false }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const cleaningExport = {
    label: 'Cleaning Records',
    icon: <CleaningIcon fontSize="small" />,
    action: () => handleExport(apiService.exportCleaningRecords, cleaningFilters, setLoading, showSuccess, showError),
    show: showCleaning,
  };

  const directoryExports = [
    {
      label: 'Staff Directory',
      icon: <StaffIcon fontSize="small" />,
      action: () => handleExport(apiService.exportStaffDirectory, {}, setLoading, showSuccess, showError),
      show: ['admin', 'principal'].includes(user?.user_type),
    },
    {
      label: 'Student Directory',
      icon: <StudentIcon fontSize="small" />,
      action: () => handleExport(apiService.exportStudentDirectory, {}, setLoading, showSuccess, showError),
      show: ['admin', 'principal', 'hod'].includes(user?.user_type),
    },
    {
      label: 'Employee Directory',
      icon: <EmployeeIcon fontSize="small" />,
      action: () => handleExport(apiService.exportEmployeeDirectory, {}, setLoading, showSuccess, showError),
      show: ['admin', 'principal'].includes(user?.user_type),
    },
  ];

  const handleExportClick = (action) => {
    action();
    handleClose();
  };

  const visibleExports = [
    ...(showCleaning && cleaningExport.show ? [cleaningExport] : []),
    ...(showDirectories ? [{ divider: true }] : []),
    ...(showDirectories ? directoryExports.filter(e => e.show) : []),
  ];

  if (visibleExports.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
        onClick={handleClick}
        disabled={loading}
      >
        Export
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {visibleExports.map((item, index) => 
          item.divider ? (
            <Divider key={`divider-${index}`} />
          ) : (
            <MenuItem key={item.label} onClick={() => handleExportClick(item.action)}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          )
        )}
      </Menu>
    </>
  );
};

export default OtherExportButton;
