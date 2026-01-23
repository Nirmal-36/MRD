import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assessment as ReportsIcon,
  School as SchoolIcon,
  LocalHospital as HospitalIcon,
  Inventory as InventoryIcon,
  Hotel as BedIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Sidebar, drawerWidth } from '../common/Sidebar';
import TopBar from '../common/TopBar';

const PrincipalLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/principal' },
    { text: 'Student Health Reports', icon: <SchoolIcon />, path: '/principal/student-health' },
    { text: 'High-Risk Patients', icon: <HospitalIcon />, path: '/principal/high-risk' },
    { text: 'Utilization Analytics', icon: <ReportsIcon />, path: '/principal/utilization' },
    { text: 'Inventory Management', icon: <InventoryIcon />, path: '/principal/inventory' },
    { text: 'Bed Capacity', icon: <BedIcon />, path: '/principal/beds' },
    { text: 'My Profile', icon: <PersonIcon />, path: '/principal/profile' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top Bar */}
      <TopBar
        title="Principal Portal"
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

      {/* Main Content */}
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

export default PrincipalLayout;
