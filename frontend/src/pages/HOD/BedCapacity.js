import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BedCapacityComponent from '../Common/Reports/BedCapacity';

// HOD wrapper - shows only their department's data
const BedCapacity = () => {
  const { user } = useAuth();
  const department = user?.department;

  return <BedCapacityComponent department={department} userRole="hod" />;
};

export default BedCapacity;
