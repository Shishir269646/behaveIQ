import { prisma } from '../config/database';
import AppError from './AppError';

/**
 * Checks if a website belongs to a given user.
 * Throws an AppError if the website is not found or does not belong to the user.
 */
export const checkWebsiteOwnership = async (websiteId: string, userId: string) => {
    const website = await prisma.website.findFirst({
        where: { id: websiteId, userId },
        select: { id: true, userId: true, name: true, domain: true, status: true, learningStartedAt: true, settings: true } // Select only necessary fields
    });
    if (!website) {
        throw new AppError('Website not found or not authorized', 404);
    }
    return website;
};
