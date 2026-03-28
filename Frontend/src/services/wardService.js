import { api } from '../api/client';

export const fetchWards = async () => {
  try {
    return await api('/wards');
  } catch (error) {
    console.error('Error fetching wards:', error);
    throw error;
  }
};

export const fetchWardCapacity = async (wardId) => {
  try {
    const url = wardId ? `/capacity?wardId=${wardId}` : '/capacity';
    return await api(url);
  } catch (error) {
    console.error(`Error fetching capacity for ward ${wardId}:`, error);
    throw error;
  }
};

export const fetchBeds = async () => {
  try {
    return await api('/api/beds');
  } catch (error) {
    console.error('Error fetching beds:', error);
    throw error;
  }
};

export const updateBedStatus = async (id, action, payload = {}) => {
  try {
    return await api(`/api/beds/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action, ...payload }),
    });
  } catch (error) {
    console.error(`Error updating bed status for bed ${id}:`, error);
    throw error;
  }
};

export const completeCleaning = async (bedId) => {
  return await updateBedStatus(bedId, 'UPDATE_STATUS', { status: 'AVAILABLE' });
};

// ─── Queue Management ────────────────────────────────────────────────────────

export const fetchQueue = async () => {
  try {
    return await api('/queue');
  } catch (error) {
    console.error('Error fetching queue:', error);
    throw error;
  }
};

export const addPatientToQueue = async (name, type) => {
  try {
    return await api('/queue', {
      method: 'POST',
      body: JSON.stringify({ name, type }),
    });
  } catch (error) {
    console.error('Error adding patient to queue:', error);
    throw error;
  }
};

export const completeQueueAction = async (id, action, wardId) => {
  try {
    let url = `/queue/${id}/complete?action=${action}`;
    if (wardId) {
      url += `&wardId=${wardId}`;
    }
    return await api(url, {
      method: 'POST',
    });
  } catch (error) {
    console.error(`Error completing queue action ${action} for queue ${id}:`, error);
    throw error;
  }
};

// ─── Analytics & Alerts ───────────────────────────────────────────────────────

export const fetchAlerts = async () => {
  try {
    return await api('/alerts');
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
};

export const fetchSummary = async () => {
  try {
    return await api('/summary');
  } catch (error) {
    console.error('Error fetching summary:', error);
    throw error;
  }
};
