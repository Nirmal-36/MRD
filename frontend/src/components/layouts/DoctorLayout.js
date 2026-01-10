import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Switch,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalHospital as TreatmentIcon,
  Hotel as BedIcon,
  LocalPharmacy as MedicineIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import { Sidebar, drawerWidth } from '../common/Sidebar';
import TopBar from '../common/TopBar';

const DoctorLayout = () => {
  const theme = useTheme();
  const { user, updateUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(user?.is_available || false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleAvailabilityToggle = async () => {
    try {
      setUpdatingAvailability(true);
      const newAvailability = !isAvailable;
      
      await apiService.updateMe({ is_available: newAvailability });
      setIsAvailable(newAvailability);
      updateUser({ ...user, is_available: newAvailability });
    } catch (error) {
      console.error('Error updating availability:', error);
      setIsAvailable(!isAvailable);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/doctor' },
    { text: 'Patients', icon: <PeopleIcon />, path: '/doctor/patients' },
    { text: 'Treatments', icon: <TreatmentIcon />, path: '/doctor/treatments' },
    { text: 'Beds', icon: <BedIcon />, path: '/doctor/beds' },
    { text: 'Medicines', icon: <MedicineIcon />, path: '/doctor/medicines' },
    { text: 'My Profile', icon: <PersonIcon />, path: '/doctor/profile' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top Bar with Availability Toggle */}
      <TopBar
        title="Doctor Portal"
        drawerWidth={drawerWidth}
        showProfileMenu={true}
        onMenuClick={handleDrawerToggle}
      >
        {/* Availability Toggle - Only for doctors and nurses */}
        {(user?.user_type === 'doctor' || user?.user_type === 'nurse') && (
          <Tooltip title={isAvailable ? "You're available for consultations" : "You're currently unavailable"}>
            <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1 }} sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.15)', 
              borderRadius: 2, 
              px: { xs: 1, sm: 1.5 }, 
              py: 0.5
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: theme.typography.fontWeightMedium,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                {isAvailable ? 'Available' : 'Unavailable'}
              </Typography>
              <Switch
                checked={isAvailable}
                onChange={handleAvailabilityToggle}
                disabled={updatingAvailability}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'success.main',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'success.main',
                  },
                }}
              />
            </Box>
          </Tooltip>
        )}
      </TopBar>

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

export default DoctorLayout;
