const mlServiceClient = require('../services/mlServiceClient');
const Persona = require('../models/Persona');
const Website = require('../models/Website');
const Event = require('../models/Event');
const { asyncHandler } = require('../utils/helpers');

const generateContent = async (req, res, next) => {
    try {
        const { personaDescription, contentType, websiteId, sessionId } = req.body;
        console.log('Content generateContent received websiteId:', websiteId);
        if (!personaDescription || !contentType || !websiteId || !sessionId) {
            return res.status(400).json({ message: 'Persona Description, ContentType, WebsiteId, and SessionId are required.' });
        }

        const website = await Website.findById(websiteId);
        console.log('Website found by ID:', website ? website._id : 'No website found');
        if (!website || website.userId.toString() !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Website not found or not authorized.' });
        }

        const content = await mlServiceClient.generateContent(personaDescription, contentType);
        
        await Event.create({
            websiteId: website._id,
            sessionId: sessionId,
            eventType: 'content_generated',
            eventData: {
                personaDescription: personaDescription,
                contentType: contentType,
                generatedContentSnippet: content.generated_content ? content.generated_content.substring(0, 200) + '...' : '', // Store snippet
                
            },
        });

        

        res.json(content);
    } catch (error) {
        next(error);
    }
};

const getContentOptions = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;

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
    getContentOptions,
};