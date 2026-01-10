import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Sidebar, drawerWidth } from '../common/Sidebar';
import TopBar from '../common/TopBar';

const PatientLayout = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/patient' },
    { text: 'Available Doctors', icon: <HospitalIcon />, path: '/patient/available-doctors' },
    
    { text: 'My Profile', icon: <PersonIcon />, path: '/patient/profile' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top Bar */}
      <TopBar
        title="Patient Portal"
        icon={HospitalIcon}
        drawerWidth={drawerWidth}
        showProfileMenu={false}
        onMenuClick={handleDrawerToggle}
      />

      {/* Sidebar Drawer */}
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

export default PatientLayout;
