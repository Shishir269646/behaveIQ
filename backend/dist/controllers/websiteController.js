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
exports.getWebsitePages = exports.getSDKScript = exports.deleteWebsite = exports.updateWebsite = exports.getWebsite = exports.createWebsite = exports.getWebsites = void 0;
const helpers_1 = require("../utils/helpers");
const responseHandler_1 = require("../utils/responseHandler");
const websiteService = __importStar(require("../services/websiteService"));
const AppError_1 = __importDefault(require("../utils/AppError"));
/**
 * Get all websites for the current user
 */
exports.getWebsites = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const websites = await websiteService.getWebsites(req.user.id);
    const websitesWithScripts = websites.map(website => ({
        ...website,
        sdkScript: websiteService.generateSDKScript(website),
    }));
    (0, responseHandler_1.sendResponse)(res, 200, { websites: websitesWithScripts, count: websites.length });
});
/**
 * Create a new website
 */
exports.createWebsite = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const website = await websiteService.createWebsite(req.user.id, req.body);
    const sdkScript = websiteService.generateSDKScript(website);
    (0, responseHandler_1.sendResponse)(res, 201, {
        website: {
            ...website,
            sdkScript,
            apiKey: website.apiKey,
        }
    });
});
/**
 * Get a single website by ID
 */
exports.getWebsite = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const id = req.params.id;
    const website = await websiteService.getWebsiteAndVerify(id, req.user.id);
    const sdkScript = websiteService.generateSDKScript(website);
    (0, responseHandler_1.sendResponse)(res, 200, {
        website: {
            ...website,
            sdkScript,
        }
    });
});
/**
 * Update a website
 */
exports.updateWebsite = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const id = req.params.id;
    const website = await websiteService.updateWebsite(id, req.user.id, req.body);
    const sdkScript = websiteService.generateSDKScript(website);
    (0, responseHandler_1.sendResponse)(res, 200, {
        website: {
            ...website,
            sdkScript,
        }
    });
});
/**
 * Delete a website
 */
exports.deleteWebsite = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const id = req.params.id;
    const website = await websiteService.getWebsiteAndVerify(id, req.user.id);
    await websiteService.deleteWebsite(website.id);
    (0, responseHandler_1.sendResponse)(res, 200, {}, 'Website deleted successfully');
});
/**
 * Get SDK script
 */
exports.getSDKScript = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const id = req.params.id;
    const website = await websiteService.getWebsiteAndVerify(id, req.user.id);
    const script = websiteService.generateSDKScript(website);
    (0, responseHandler_1.sendResponse)(res, 200, { script });
});
/**
 * Get all unique page URLs for a website
 */
exports.getWebsitePages = (0, helpers_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new AppError_1.default('Not authorized', 401);
    const websiteId = req.params.websiteId;
    await websiteService.getWebsiteAndVerify(websiteId, req.user.id);
    const pages = await websiteService.getWebsitePages(websiteId);
    (0, responseHandler_1.sendResponse)(res, 200, { pages, count: pages.length });
});
