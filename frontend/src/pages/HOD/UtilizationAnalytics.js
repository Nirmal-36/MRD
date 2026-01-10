import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UtilizationAnalyticsComponent from '../Common/Reports/UtilizationAnalytics';

// HOD wrapper - shows only their department's data
const UtilizationAnalytics = () => {
  const { user } = useAuth();
  const department = user?.department;

  return <UtilizationAnalyticsComponent department={department} userRole="hod" />;
};

export default UtilizationAnalytics;
