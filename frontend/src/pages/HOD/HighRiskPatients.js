import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import HighRiskPatientsComponent from '../Common/Reports/HighRiskPatients';

// HOD wrapper - shows only their department's data
const HighRiskPatients = () => {
  const { user } = useAuth();
  const department = user?.department;

  return <HighRiskPatientsComponent department={department} userRole="hod" />;
};

export default HighRiskPatients;
