const mlServiceClient = require('../services/mlServiceClient');
const { asyncHandler } = require('../utils/helpers');
const { prisma } = require('../config/database');

const generateContent = async (req, res, next) => {
    try {
        const { personaDescription, contentType, websiteId, sessionId } = req.body;
        console.log('Content generateContent received websiteId:', websiteId);
        if (!personaDescription || !contentType || !websiteId || !sessionId) {
            return res.status(400).json({ message: 'Persona Description, ContentType, WebsiteId, and SessionId are required.' });
        }

        const website = await prisma.website.findUnique({ where: { id: websiteId } });
        console.log('Website found by ID:', website ? website.id : 'No website found');
        if (!website || website.userId !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Website not found or not authorized.' });
        }

        const content = await mlServiceClient.generateContent(personaDescription, contentType);
        
        await prisma.event.create({
            data: {
                websiteId: website.id,
                sessionId: sessionId,
                eventType: 'content_generated', // Assuming 'content_generated' is a valid EventType enum value
                eventData: {
                    personaDescription: personaDescription,
                    contentType: contentType,
                    generatedContentSnippet: content.generated_content ? content.generated_content.substring(0, 200) + '...' : '', // Store snippet
                },
            }
        });

        

        res.json(content);
    } catch (error) {
        next(error);
    }
};

const getContentOptions = asyncHandler(async (req, res) => {
    const { websiteId } = req.query;

    const website = await prisma.website.findFirst({ where: { id: websiteId, userId: req.user.id } });
    if (!website) {
        return res.status(404).json({ success: false, message: 'Website not found or not authorized.' });
    }

    // Fetch active personas for the website
    const personas = await prisma.persona.findMany({
        where: { websiteId, isActive: true },
        select: {
            id: true,
            name: true,
            clusterData: {
                select: {
                    behaviorPattern: true
                }
            }
        }
    });

    const formattedPersonas = personas.map(p => ({
        id: p.id,
        name: p.name,
        behaviorPattern: p.clusterData?.behaviorPattern || null // Handle null clusterData
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