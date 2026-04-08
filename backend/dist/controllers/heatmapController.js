"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHeatmapData = void 0;
const database_1 = require("../config/database");
const helpers_1 = require("../utils/helpers");
const AppError_1 = __importDefault(require("../utils/AppError"));
/**
 * Get heatmap data for a page
 */
exports.getHeatmapData = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { websiteId, pageUrl } = req.query;
    if (!websiteId || !pageUrl) {
        throw new AppError_1.default('Website ID and Page URL are required.', 400);
    }
    if (!req.user?.id)
        throw new AppError_1.default('Not authorized', 401);
    const decodedPageUrl = decodeURIComponent(pageUrl);
    // Ownership check
    const website = await database_1.prisma.website.findUnique({
        where: { id: websiteId, userId: req.user.id }
    });
    if (!website) {
        throw new AppError_1.default('Website not found or not authorized', 403);
    }
    // Fetch click heatmap data
    const clicks = await database_1.prisma.click.findMany({
        where: {
            websiteId: website.id,
            pageUrl: decodedPageUrl
        },
        select: {
            x: true,
            y: true,
            element: true
        }
    });
    const clickData = clicks.map(click => ({
        x: click.x,
        y: click.y,
        value: 1
    }));
    const scrollDepth = {
        avgScrollDepth: 0,
        maxScrollDepth: 0
    };
    const confusionZones = [];
    res.setHeader('Cache-Control', 'no-store');
    res.json({
        success: true,
        data: {
            clicks: clickData,
            scrollDepth,
            confusionZones
        }
    });
});
