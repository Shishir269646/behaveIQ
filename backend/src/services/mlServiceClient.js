const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Call ML Service API
 * @param {string} endpoint - ML endpoint (e.g., '/llm/content-generation')
 * @param {object} payload - Data to send
 * @param {string} method - HTTP method (default: 'POST')
 */
exports.callMLService = async (endpoint, payload, method = 'POST') => {
    const url = `${ML_SERVICE_URL}/ml/v1${endpoint}`;

    try {
        const response = await axios({
            method,
            url,
            data: payload,
            timeout: 30000, // 30 seconds
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: status => status < 500 // allow 4xx to handle manually
        });

        // Handle 4xx (validation) responses explicitly
        if (response.status >= 400) {
            console.error('❌ ML VALIDATION ERROR');
            console.error('Status:', response.status);
            console.error('Raw ML Response:', JSON.stringify(response.data, null, 2));
            console.error('Payload Sent:', JSON.stringify(payload, null, 2));

            let message = 'ML Service validation failed';

            if (Array.isArray(response.data?.detail)) {
                // Format FastAPI Pydantic validation errors
                message = response.data.detail
                    .map(err => `${err.loc?.join(' -> ')} : ${err.msg}`)
                    .join(' | ');
            } else if (typeof response.data?.detail === 'string') {
                message = response.data.detail;
            } else if (response.data?.message) {
                message = response.data.message;
            }

            throw new Error(message);
        }

        return response.data;

    } catch (error) {
        console.error('🔥 ML Service call failed');

        if (error.response) {
            // Axios response error
            const status = error.response.status;
            const data = error.response.data;
            console.error('Status:', status);
            console.error('Data:', JSON.stringify(data, null, 2));
            console.error('Payload:', JSON.stringify(payload, null, 2));

            let message = 'ML Service error';
            // Prioritize specific error message from ML service
            if (typeof data?.detail === 'string' && data.detail.length > 0) {
                message = data.detail;
            } else if (Array.isArray(data?.detail)) {
                message = data.detail.map(err => `${err.loc?.join(' -> ')} : ${err.msg}`).join(' | ');
            } else if (data?.message) {
                message = data.message;
            }
            // Fallback to generic message if nothing specific was found
            if (message === 'ML Service error' && status >= 500) {
                 message = `Internal ML Service Error (Status: ${status}). Check ML Service logs for details.`;
            }

            throw new Error(message);
        }

        if (error.request) {
            // No response (timeout or connection issue)
            throw new Error('ML Service not responding or timeout');
        }

        throw error;
    }
};

/**
 * Generate content from ML Service (LLM)
 * @param {string} personaDescription - Persona description string
 * @param {string} contentType - Content type (e.g., "email", "blog", etc.)
 */
exports.generateContent = async (personaDescription, contentType) => {
    try {
        return await exports.callMLService(
            '/llm/content-generation',
            {
                persona: personaDescription, // Pass personaDescription here
                content_type: contentType
            },
            'POST'
        );
    } catch (error) {
        console.error('❌ Error in generateContent:', error.message);
        throw error;
    }
};
