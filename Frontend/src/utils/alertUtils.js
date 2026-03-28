/**
 * Shared transformation logic for WardWatch Alert System.
 * Ensures WardCard and WardDetailPage use exactly the same strings and priorities.
 */

export const transformAlert = (alert, occupiedBeds, totalBeds) => {
  if (alert.type === 'CLEANING') {
    return `Bed #${alert.bedId} cleaning delayed — complete now`;
  }

  if (alert.type === 'CAPACITY') {
    const ratio = totalBeds > 0 ? occupiedBeds / totalBeds : 0;
    if (ratio >= 0.95) return "Ward full — redirect admissions";
    if (ratio >= 0.85) return "Ward near full — prepare discharge";
  }

  return null;
};

export const sortAlerts = (alerts) => {
  return [...alerts].sort((a, b) => {
    if (a.type === 'CLEANING' && b.type !== 'CLEANING') return -1;
    if (a.type !== 'CLEANING' && b.type === 'CLEANING') return 1;
    return 0;
  });
};
