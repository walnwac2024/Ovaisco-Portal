import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export const birthdayService = {
    /**
     * Send a birthday wish to a colleague
     * @param {number} receiverId 
     * @param {string} message 
     */
    sendWish: async (receiverId, message = "Happy Birthday!") => {
        try {
            const response = await axios.post(`${API_URL}/birthdays/wish`, {
                receiverId,
                message
            }, { withCredentials: true });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Get wishes received by the logged-in user today
     */
    getReceivedWishes: async () => {
        try {
            const response = await axios.get(`${API_URL}/birthdays/wishes/received`, { withCredentials: true });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};
