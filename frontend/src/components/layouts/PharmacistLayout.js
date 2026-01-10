import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as RequestIcon,
  Warning as WarningIcon,
  TrendingUp as TransactionIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Sidebar, drawerWidth } from '../common/Sidebar';
import TopBar from '../common/TopBar';

const PharmacistLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/pharmacist' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/pharmacist/inventory' },
    { text: 'Stock Requests', icon: <RequestIcon />, path: '/pharmacist/stock-requests' },
    { text: 'Low Stock Alerts', icon: <WarningIcon />, path: '/pharmacist/low-stock' },
    { text: 'Transactions', icon: <TransactionIcon />, path: '/pharmacist/transactions' },
    { text: 'My Profile', icon: <PersonIcon />, path: '/pharmacist/profile' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top Bar */}
      <TopBar
        title="Pharmacist Portal"
        drawerWidth={drawerWidth}
        showProfileMenu={true}
        onMenuClick={handleDrawerToggle}
      />

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile Drawer */}
        <Sidebar
          menuItems={menuItems}
          mobileOpen={mobileOpen}
          onDrawerToggle={handleDrawerToggle}
          variant="temporary"
        />
        {/* Desktop Drawer */}
        <Sidebar
          menuItems={menuItems}
          variant="permanent"
        />
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, sm: 8 },
          minHeight: '100vh',
          overflowX: 'hidden',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default PharmacistLayout;
