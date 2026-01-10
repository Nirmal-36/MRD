import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import HighRiskStudentsComponent from '../Common/Reports/HighRiskStudents';

// HOD wrapper - shows only their department's data
const HighRiskStudents = () => {
  const { user } = useAuth();
  const department = user?.department;

  return <HighRiskStudentsComponent department={department} userRole="hod" />;
};

export default HighRiskStudents;
