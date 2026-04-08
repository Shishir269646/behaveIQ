import { Request, Response, NextFunction } from 'express';
import mlServiceClient from '../services/mlServiceClient';
import { asyncHandler } from '../utils/helpers';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';
import AppError from '../utils/AppError';

/**
 * Generate AI content
 */
export const generateContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { personaDescription, contentType, websiteId, sessionId } = req.body;
    
    if (!personaDescription || !contentType || !websiteId || !sessionId) {
        throw new AppError('Persona Description, ContentType, WebsiteId, and SessionId are required.', 400);
    }

    if (!req.user?.id) throw new AppError('Not authorized', 401);

    const website = await prisma.website.findUnique({ where: { id: websiteId } });
    if (!website || website.userId !== req.user.id) {
        throw new AppError('Website not found or not authorized.', 404);
    }

    const content = await mlServiceClient.generateContent(personaDescription, contentType);
    
    await prisma.event.create({
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
export const getContentOptions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { websiteId } = req.query;
    if (!req.user?.id) throw new AppError('Not authorized', 401);

    const website = await prisma.website.findFirst({ 
      where: { id: websiteId as string, userId: req.user.id } 
    });
    
    if (!website) {
        throw new AppError('Website not found or not authorized.', 404);
    }

    const personas = await prisma.persona.findMany({
        where: { websiteId: websiteId as string, isActive: true },
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
