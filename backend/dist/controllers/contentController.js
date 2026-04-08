"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContentOptions = exports.generateContent = void 0;
const mlServiceClient_1 = __importDefault(require("../services/mlServiceClient"));
const helpers_1 = require("../utils/helpers");
const database_1 = require("../config/database");
const AppError_1 = __importDefault(require("../utils/AppError"));
/**
 * Generate AI content
 */
exports.generateContent = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { personaDescription, contentType, websiteId, sessionId } = req.body;
    if (!personaDescription || !contentType || !websiteId || !sessionId) {
        throw new AppError_1.default('Persona Description, ContentType, WebsiteId, and SessionId are required.', 400);
    }
    if (!req.user?.id)
        throw new AppError_1.default('Not authorized', 401);
    const website = await database_1.prisma.website.findUnique({ where: { id: websiteId } });
    if (!website || website.userId !== req.user.id) {
        throw new AppError_1.default('Website not found or not authorized.', 404);
    }
    const content = await mlServiceClient_1.default.generateContent(personaDescription, contentType);
    await database_1.prisma.event.create({
        data: {
            websiteId: website.id,
            sessionId: sessionId,
            eventType: 'content_generated',
            eventData: {
                personaDescription: personaDescription,
                contentType: contentType,
                generatedContentSnippet: content.generated_content ? content.generated_content.substring(0, 200) + '...' : '',
            },
        }
    });
    res.json(content);
});
/**
 * Get content generation options
 */
exports.getContentOptions = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { websiteId } = req.query;
    if (!req.user?.id)
        throw new AppError_1.default('Not authorized', 401);
    const website = await database_1.prisma.website.findFirst({
        where: { id: websiteId, userId: req.user.id }
    });
    if (!website) {
        throw new AppError_1.default('Website not found or not authorized.', 404);
    }
    const personas = await database_1.prisma.persona.findMany({
        where: { websiteId: websiteId, isActive: true },
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
        behaviorPattern: p.clusterData?.behaviorPattern || null
    }));
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
