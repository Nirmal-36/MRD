import React from 'react';
import BedCapacityComponent from '../Common/Reports/BedCapacity';

// Principal wrapper - shows all data (no department filter)
const BedCapacity = () => {
  return <BedCapacityComponent userRole="principal" />;
};

export default BedCapacity;
