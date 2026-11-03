import axios from 'axios';

export const getStatistics = async () => {
  try {
    const response = await axios.get(`${process.env.PUBLIC_URL}/api/statistics/`);
    return response.data;
  } catch (error) {
    console.log('Error getting statistics:', error.response ? error.response.data : error.message);
    throw error;
  }
};

