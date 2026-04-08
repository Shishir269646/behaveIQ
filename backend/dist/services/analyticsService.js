"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebsiteAnalyticsSummary = void 0;
const database_1 = require("../config/database");
/**
 * Get website analytics summary
 */
const getWebsiteAnalyticsSummary = async (websiteId, timeRange = "7d") => {
    try {
        // Check website
        const website = await database_1.prisma.website.findUnique({
            where: { id: websiteId },
        });
        if (!website) {
            throw new Error("Website not found");
        }
        // Parse time range
        const days = parseInt(timeRange.replace("d", ""), 10) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        // Run queries in parallel
        const [totalSessions, totalPageViews, uniqueVisitors] = await Promise.all([
            database_1.prisma.session.count({
                where: {
                    websiteId: websiteId,
                    startTime: {
                        gte: startDate,
                    },
                },
            }),
            database_1.prisma.event.count({
                where: {
                    websiteId: websiteId,
                    eventType: "pageview",
                    timestamp: {
                        gte: startDate,
                    },
                },
            }),
            database_1.prisma.session.findMany({
                where: {
                    websiteId: websiteId,
                    startTime: {
                        gte: startDate,
                    },
                },
                distinct: ["fingerprint"],
                select: {
                    fingerprint: true,
                },
            }),
        ]);
        return {
            totalSessions,
            totalPageViews,
            totalUniqueVisitors: uniqueVisitors.length,
            timeRange: `${days}d`,
            startDate,
            endDate: new Date(),
        };
    }
    catch (error) {
        console.error("[AnalyticsService] Error getting website analytics summary:", error);
        throw error;
    }
};
exports.getWebsiteAnalyticsSummary = getWebsiteAnalyticsSummary;
