const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Call ML Service API
 */
exports.callMLService = async (endpoint, data, method = 'POST') => {
    try {
        const url = `${ML_SERVICE_URL}/ml/v1${endpoint}`;

        const response = await axios({
            method,
            url,
            data,
            timeout: 30000, // 30 seconds
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data;

    } catch (error) {
        console.error('ML Service call error:', error.message);

        if (error.response) {
            throw new Error(`ML Service error: ${error.response.data.message || error.message}`);
        } else if (error.request) {
            throw new Error('ML Service not responding');
        } else {
            throw error;
        }
    }
};