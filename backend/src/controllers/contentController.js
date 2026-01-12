const mlServiceClient = require('../services/mlServiceClient');
const Persona = require('../models/Persona'); // New Import
const Website = require('../models/Website'); // New Import
const Event = require('../models/Event'); // New Import
const { asyncHandler } = require('../utils/helpers'); // New Import

const generateContent = async (req, res, next) => {
    try {
        const { persona, contentType, websiteId } = req.body; // Added websiteId
        console.log('Content generateContent received websiteId:', websiteId); // DEBUG LOG
        if (!persona || !contentType || !websiteId) {
            return res.status(400).json({ message: 'Persona, contentType, and websiteId are required.' });
        }

        const website = await Website.findById(websiteId); // Verify website ownership or existence
        console.log('Website found by ID:', website ? website._id : 'No website found'); // DEBUG LOG
        if (!website || website.userId.toString() !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Website not found or not authorized.' });
        }

        const content = await mlServiceClient.generateContent(persona, contentType); // Pass websiteId to the ML service if needed
        
        await Event.create({
            websiteId: website._id,
            sessionId: req.body.sessionId || null, // Optional, depending on context
            eventType: 'content_generated',
            eventData: {
                personaId: persona,
                contentType: contentType,
                generatedContentSnippet: content.generated_content ? content.generated_content.substring(0, 200) + '...' : '', // Store snippet
                // Full content might be too large; consider storing a reference or summary
            },
        });

        res.json(content);
    } catch (error) {
        next(error);
    }
};

const getContentOptions = asyncHandler(async (req, res) => {
    const { websiteId } = req.query; // Assuming websiteId is passed as a query parameter

    const website = await Website.findOne({ _id: websiteId, userId: req.user._id });
    if (!website) {
        return res.status(404).json({ success: false, message: 'Website not found or not authorized.' });
    }

    // Fetch active personas for the website
    const personas = await Persona.find({ websiteId, isActive: true }).select('name clusterData.behaviorPattern');

    const formattedPersonas = personas.map(p => ({
        id: p._id,
        name: p.name,
        behaviorPattern: p.clusterData.behaviorPattern
    }));

    // Predefined list of content types
    const contentTypes = [
        { key: 'headline', name: 'Headline' },
        { key: 'product_description', name: 'Product Description' },
        { key: 'email_subject', name: 'Email Subject' },
        { key: 'cta_text', name: 'Call to Action (CTA)' },
        { key: 'social_media_post', name: 'Social Media Post' }
    ];

    res.json({
        success: true,
        data: {
            personas: formattedPersonas,
            contentTypes: contentTypes
        }
    });
});

module.exports = {
    generateContent,
    getContentOptions, // Export the new function
};
