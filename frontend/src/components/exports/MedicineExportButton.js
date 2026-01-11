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
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Schedule as ExpiringIcon,
  SwapHoriz as TransactionIcon,
  ShoppingCart as RequestIcon,
} from '@mui/icons-material';
import apiService from '../../services/api';
import { handleExport } from '../../utils/exportUtils';
import { useToast } from '../../components/common/Toast';

/**
 * Export menu for Medicine/Pharmacy data
 */
const MedicineExportButton = ({ transactionFilters = {}, requestFilters = {} }) => {
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
      label: 'Medicine Inventory',
      icon: <InventoryIcon fontSize="small" />,
      action: () => handleExport(apiService.exportMedicineInventory, {}, setLoading, showSuccess, showError),
    },
    {
      label: 'Low Stock Medicines',
      icon: <WarningIcon fontSize="small" color="warning" />,
      action: () => handleExport(apiService.exportLowStockMedicines, {}, setLoading, showSuccess, showError),
    },
    {
      label: 'Expiring Medicines',
      icon: <ExpiringIcon fontSize="small" color="error" />,
      action: () => handleExport(apiService.exportExpiringMedicines, { days: 90 }, setLoading, showSuccess, showError),
    },
    { divider: true },
    {
      label: 'Transactions',
      icon: <TransactionIcon fontSize="small" />,
      action: () => handleExport(apiService.exportMedicineTransactions, transactionFilters, setLoading, showSuccess, showError),
    },
    {
      label: 'Stock Requests',
      icon: <RequestIcon fontSize="small" />,
      action: () => handleExport(apiService.exportStockRequests, requestFilters, setLoading, showSuccess, showError),
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
        {exports.map((item, index) => 
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

export default MedicineExportButton;
