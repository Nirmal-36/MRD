import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Assessment as ReportsIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Sidebar, drawerWidth } from '../common/Sidebar';
import TopBar from '../common/TopBar';

const HODLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/hod' },
    { text: 'Student Health Reports', icon: <SchoolIcon />, path: '/hod/student-health' },
    { text: 'High-Risk Patients', icon: <HospitalIcon />, path: '/hod/high-risk' },
    { text: 'Utilization Analytics', icon: <ReportsIcon />, path: '/hod/utilization' },
    { text: 'Inventory Management', icon: <HospitalIcon />, path: '/hod/inventory' },
    { text: 'Bed Capacity', icon: <PeopleIcon />, path: '/hod/beds' },
    { text: 'My Profile', icon: <PersonIcon />, path: '/hod/profile' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top Bar */}
      <TopBar
        title="HOD Portal"
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

export default HODLayout;
