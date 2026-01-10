import React from 'react';
import UtilizationAnalyticsComponent from '../Common/Reports/UtilizationAnalytics';

// Principal wrapper - shows all data (no department filter)
const UtilizationAnalytics = () => {
  return <UtilizationAnalyticsComponent userRole="principal" />;
};

export default UtilizationAnalytics;
