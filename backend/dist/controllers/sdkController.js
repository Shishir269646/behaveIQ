"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateIntent = exports.getPersonalization = exports.sendHeartbeat = exports.trackEvent = exports.identifyUser = exports.getSDKConfig = void 0;
const database_1 = require("../config/database");
const helpers_1 = require("../utils/helpers");
const AppError_1 = __importDefault(require("../utils/AppError"));
const mlServiceClient = __importStar(require("../services/mlServiceClient"));
/**
 * Get SDK configuration
 */
exports.getSDKConfig = (0, helpers_1.asyncHandler)(async (req, res) => {
    const apiKey = req.query.apiKey;
    if (!apiKey) {
        throw new AppError_1.default('API Key is required', 400);
    }
    const website = await database_1.prisma.website.findUnique({
        where: { apiKey },
        include: { settings: true }
    });
    if (!website) {
        throw new AppError_1.default('Invalid API Key', 401);
    }
    res.json({
        success: true,
        data: {
            websiteId: website.id,
            name: website.name,
            settings: website.settings,
            plan: website.plan,
            status: website.status
        }
    });
});
/**
 * Identify user
 */
exports.identifyUser = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { apiKey, externalId, traits, fingerprint } = req.body;
    const website = await database_1.prisma.website.findUnique({ where: { apiKey } });
    if (!website) {
        throw new AppError_1.default('Invalid API Key', 401);
    }
    // Logic to link externalId/traits to a user and session
    // This is a simplified version
    res.json({
        success: true,
        message: 'User identified'
    });
});
/**
 * Track event from SDK
 */
exports.trackEvent = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { apiKey, sessionId, eventType, eventData, url, timestamp } = req.body;
    const website = await database_1.prisma.website.findUnique({ where: { apiKey } });
    if (!website) {
        throw new AppError_1.default('Invalid API Key', 401);
    }
    let session = await database_1.prisma.session.findUnique({
        where: { sessionId }
    });
    if (!session) {
        session = await database_1.prisma.session.create({
            data: {
                sessionId,
                websiteId: website.id,
                fingerprint: req.body.fingerprint || 'unknown',
                startTime: new Date(timestamp || Date.now())
            }
        });
    }
    const event = await database_1.prisma.event.create({
        data: {
            sessionId: session.id,
            websiteId: website.id,
            eventType: eventType,
            eventData: eventData || {},
            timestamp: new Date(timestamp || Date.now())
        }
    });
    res.json({
        success: true,
        data: { eventId: event.id }
    });
});
/**
 * Send heartbeat
 */
exports.sendHeartbeat = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { apiKey, sessionId } = req.body;
    const website = await database_1.prisma.website.findUnique({ where: { apiKey } });
    if (!website) {
        throw new AppError_1.default('Invalid API Key', 401);
    }
    await database_1.prisma.session.update({
        where: { sessionId },
        data: { updatedAt: new Date() }
    });
    res.json({ success: true });
});
/**
 * Get personalization rules
 */
exports.getPersonalization = (0, helpers_1.asyncHandler)(async (req, res) => {
    const apiKey = req.params.apiKey;
    const sessionId = req.params.sessionId;
    const website = await database_1.prisma.website.findUnique({
        where: { apiKey },
        include: { settings: true }
    });
    if (!website) {
        throw new AppError_1.default('Invalid API Key', 401);
    }
    const session = await database_1.prisma.session.findUnique({
        where: { sessionId: sessionId },
        include: {
            persona: { include: { personalizationRules: true } },
        }
    });
    if (!session) {
        throw new AppError_1.default('Session not found', 404);
    }
    const personalizationRules = [];
    if (website.settings?.autoPersonalization && session.persona) {
        const persona = session.persona;
        if (persona?.isActive) {
            personalizationRules.push(...persona.personalizationRules.filter((r) => r.isActive));
        }
    }
    if (website.settings?.experimentMode && session.experimentId && session.experimentVariation) {
        const experiment = await database_1.prisma.experiment.findUnique({
            where: { id: session.experimentId },
            include: { variations: true }
        });
        if (experiment?.status === 'active') {
            const variation = experiment.variations.find(v => v.name === session.experimentVariation);
            if (variation && !variation.isControl) {
                personalizationRules.push({
                    selector: variation.selector,
                    content: variation.content,
                    contentType: variation.contentType,
                    experimentId: experiment.id,
                    variationName: variation.name
                });
            }
        }
    }
    res.json({
        success: true,
        data: { personalizationRules }
    });
});
/**
 * Calculate intent score
 */
exports.calculateIntent = (0, helpers_1.asyncHandler)(async (req, res) => {
    const { apiKey, sessionId, sessionData } = req.body;
    const website = await database_1.prisma.website.findUnique({ where: { apiKey } });
    if (!website) {
        throw new AppError_1.default('Invalid API Key', 401);
    }
    const session = await database_1.prisma.session.findUnique({
        where: { sessionId: sessionId },
        include: { intentScore: true }
    });
    if (!session) {
        throw new AppError_1.default('Session not found', 404);
    }
    let intentScore = 0;
    try {
        const mlResult = await mlServiceClient.callMLService('/intent/score', {
            websiteId: website.id,
            sessionId: session.id,
            sessionData
        });
        intentScore = mlResult?.score || 0;
    }
    catch (error) {
        console.error('ML intent scoring failed:', error.message);
        intentScore = session.intentScore?.final || 10;
    }
    await database_1.prisma.sessionIntentScore.upsert({
        where: { sessionId: session.id },
        update: {
            final: intentScore,
            changes: {
                create: {
                    score: intentScore,
                    timestamp: new Date()
                }
            }
        },
        create: {
            sessionId: session.id,
            final: intentScore,
            changes: {
                create: {
                    score: intentScore,
                    timestamp: new Date()
                }
            }
        }
    });
    res.json({
        success: true,
        data: { intentScore }
    });
});
