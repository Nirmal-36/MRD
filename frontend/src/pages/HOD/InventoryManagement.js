import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import InventoryManagementComponent from '../Common/Reports/InventoryManagement';

// HOD wrapper - shows only their department's data
const InventoryManagement = () => {
  const { user } = useAuth();
  const department = user?.department;

  return <InventoryManagementComponent department={department} userRole="hod" />;
};

export default InventoryManagement;
