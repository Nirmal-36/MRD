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
  CleaningServices as CleaningIcon,
  CalendarToday as CalendarIcon,
  Star as RatingIcon,
} from '@mui/icons-material';
import apiService from '../../services/api';
import { handleExport } from '../../utils/exportUtils';
import { useToast } from '../../components/common/Toast';

/**
 * Export menu for Cleaning Records data
 */
const CleaningExportButton = ({ filters = {} }) => {
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
      label: 'All Cleaning Records',
      icon: <CleaningIcon fontSize="small" />,
      action: () => handleExport(apiService.exportCleaningRecords, filters, setLoading, showSuccess, showError),
    },
    {
      label: "Today's Records",
      icon: <CalendarIcon fontSize="small" />,
      action: () => handleExport(
        apiService.exportCleaningRecords,
        { ...filters, cleaning_date: new Date().toISOString().split('T')[0] },
        setLoading,
        showSuccess,
        showError
      ),
    },
    {
      label: 'High Quality Records (4+ stars)',
      icon: <RatingIcon fontSize="small" color="warning" />,
      action: () => handleExport(
        apiService.exportCleaningRecords,
        { ...filters, min_rating: 4 },
        setLoading,
        showSuccess,
        showError
      ),
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

export default CleaningExportButton;
