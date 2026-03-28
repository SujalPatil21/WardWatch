const BASE_URL = 'http://localhost:8080';

export const fetchWards = async () => {
  try {
    const response = await fetch(`${BASE_URL}/wards`);
    if (!response.ok) throw new Error('Failed to fetch wards');
    return await response.json();
  } catch (error) {
    console.error("Error fetching wards:", error);
    throw error;
  }
};

export const fetchWardCapacity = async (wardId) => {
  try {
    const response = await fetch(`${BASE_URL}/capacity?wardId=${wardId}`);
    if (!response.ok) throw new Error('Failed to fetch capacity');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching capacity for ward ${wardId}:`, error);
    throw error;
  }
};
