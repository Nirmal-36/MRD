import React from 'react';
import HighRiskStudentsComponent from '../Common/Reports/HighRiskStudents';

// Principal wrapper - shows all data (no department filter)
const HighRiskStudents = () => {
  return <HighRiskStudentsComponent userRole="principal" />;
};

export default HighRiskStudents;
