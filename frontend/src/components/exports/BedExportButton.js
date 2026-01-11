import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  Hotel as BedIcon,
  PersonAdd as AllocateIcon,
  People as CurrentIcon,
} from '@mui/icons-material';
import apiService from '../../services/api';
import { handleExport } from '../../utils/exportUtils';
import { useToast } from '../../components/common/Toast';

/**
 * Export menu for Bed Management data
 */
const BedExportButton = ({ allocationFilters = {} }) => {
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

  const exports = [
    {
      label: 'Bed Inventory',
      icon: <BedIcon fontSize="small" />,
      action: () => handleExport(apiService.exportBedInventory, {}, setLoading, showSuccess, showError),
    },
    {
      label: 'Current Patients',
      icon: <CurrentIcon fontSize="small" />,
      action: () => handleExport(apiService.exportCurrentPatients, {}, setLoading, showSuccess, showError),
    },
    {
      label: 'Allocation History',
      icon: <AllocateIcon fontSize="small" />,
      action: () => handleExport(apiService.exportBedAllocations, allocationFilters, setLoading, showSuccess, showError),
    },
  ];

  const handleExportClick = (action) => {
    action();
    handleClose();
  };

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
        {exports.map((item) => (
          <MenuItem key={item.label} onClick={() => handleExportClick(item.action)}>
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default BedExportButton;
