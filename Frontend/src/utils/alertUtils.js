/**
 * Shared transformation logic for WardWatch Alert System.
 * Ensures WardCard and WardDetailPage use exactly the same strings and priorities.
 */

export const transformAlert = (alert) => {
  if (alert.type === 'CLEANING_DELAY') {
    return `Bed #${alert.bedId} cleaning overdue — complete immediately`;
  }

  if (alert.type === 'CAPACITY_CRITICAL') {
    return "Ward full — discharge patients or admit to another ward";
  }

  if (alert.type === 'CAPACITY_WARNING') {
    return "Ward near full — prepare discharge or free beds";
  }

  return null;
};

export const sortAlerts = (alerts) => {
  return [...alerts].sort((a, b) => {
    // Cleaning is always top priority
    if (a.type === 'CLEANING_DELAY' && b.type !== 'CLEANING_DELAY') return -1;
    if (a.type !== 'CLEANING_DELAY' && b.type === 'CLEANING_DELAY') return 1;
    
    // Critical is second priority
    if (a.type === 'CAPACITY_CRITICAL' && b.type === 'CAPACITY_WARNING') return -1;
    if (a.type === 'CAPACITY_WARNING' && b.type === 'CAPACITY_CRITICAL') return 1;
    
    return 0;
  });
};
