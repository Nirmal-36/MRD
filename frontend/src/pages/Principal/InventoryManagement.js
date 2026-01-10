import React from 'react';
import InventoryManagementComponent from '../Common/Reports/InventoryManagement';

// Principal wrapper - shows all data (no department filter)
const InventoryManagement = () => {
  return <InventoryManagementComponent userRole="principal" />;
};

export default InventoryManagement;
