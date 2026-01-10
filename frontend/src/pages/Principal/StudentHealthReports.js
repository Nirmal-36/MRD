import React from 'react';
import StudentHealthReportsComponent from '../Common/Reports/StudentHealthReports';

// Principal wrapper - shows all data (no department filter)
const StudentHealthReports = () => {
  return <StudentHealthReportsComponent userRole="principal" />;
};

export default StudentHealthReports;
