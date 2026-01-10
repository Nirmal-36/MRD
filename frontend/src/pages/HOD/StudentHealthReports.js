import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StudentHealthReportsComponent from '../Common/Reports/StudentHealthReports';

// HOD wrapper - shows only their department's data
const StudentHealthReports = () => {
  const { user } = useAuth();
  const department = user?.department;

  return <StudentHealthReportsComponent department={department} userRole="hod" />;
};

export default StudentHealthReports;
