const mlServiceClient = require('../services/mlServiceClient');

const generateContent = async (req, res, next) => {
    try {
        const { persona, contentType } = req.body;
        if (!persona || !contentType) {
            return res.status(400).json({ message: 'Persona and contentType are required.' });
        }

        const content = await mlServiceClient.generateContent(persona, contentType);
        res.json(content);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    generateContent,
};
