import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.user_type)) {
    const roleRoutes = {
      admin: '/admin',
      doctor: '/doctor',
      nurse: '/doctor',
      pharmacist: '/pharmacist',
      student: '/patient',
      employee: '/patient',
      principal: '/principal',
      hod: '/hod',
    };
    
    return <Navigate to={roleRoutes[user?.user_type] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
