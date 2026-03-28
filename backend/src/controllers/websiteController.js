const { asyncHandler } = require('../utils/helpers');
const { sendResponse } = require('../utils/responseHandler');
const websiteService = require('../services/websiteService');

// Get all websites for user
const getWebsites = asyncHandler(async (req, res) => {
    const websites = await websiteService.getWebsites(req.user.id); // Use req.user.id
    
    const websitesWithScripts = websites.map(website => ({
        ...website,
        sdkScript: websiteService.generateSDKScript(website),
    }));

    sendResponse(res, 200, { websites: websitesWithScripts, count: websites.length });
});

//  Create new website
const createWebsite = asyncHandler(async (req, res) => {
    const website = await websiteService.createWebsite(req.user.id, req.body); // Use req.user.id
    const sdkScript = websiteService.generateSDKScript(website);

    sendResponse(res, 201, {
        website: {
            ...website, // website is already a plain object from Prisma
            sdkScript,
            apiKey: website.apiKey,
        }
    });
});

// Get single website
const getWebsite = asyncHandler(async (req, res) => {
    const website = await websiteService.getWebsiteAndVerify(req.params.id, req.user.id); // Use req.user.id
    const sdkScript = websiteService.generateSDKScript(website);

    sendResponse(res, 200, {
        website: {
            ...website, // website is already a plain object from Prisma
            sdkScript,
        }
    });
});

//  Update website
const updateWebsite = asyncHandler(async (req, res) => {
    const website = await websiteService.updateWebsite(req.params.id, req.user.id, req.body); // Use req.user.id
    const sdkScript = websiteService.generateSDKScript(website);

    sendResponse(res, 200, {
        website: {
            ...website, // website is already a plain object from Prisma
            sdkScript,
        }
    });
});

//  Delete website
const deleteWebsite = asyncHandler(async (req, res) => {
    const website = await websiteService.getWebsiteAndVerify(req.params.id, req.user.id); // Use req.user.id
    await websiteService.deleteWebsite(website.id); // Assuming a deleteWebsite function in service
    sendResponse(res, 200, {}, 'Website deleted successfully');
});

//   Get SDK script
const getSDKScript = asyncHandler(async (req, res) => {
    const website = await websiteService.getWebsiteAndVerify(req.params.id, req.user.id); // Use req.user.id
    const script = websiteService.generateSDKScript(website);
    sendResponse(res, 200, { script });
});

// Get all unique page URLs for a website
const getWebsitePages = asyncHandler(async (req, res) => {
    await websiteService.getWebsiteAndVerify(req.params.websiteId, req.user.id); // Use req.user.id
    const pages = await websiteService.getWebsitePages(req.params.websiteId);
    sendResponse(res, 200, { pages, count: pages.length });
});

module.exports = {
    getWebsites,
    createWebsite,
    getWebsite,
    updateWebsite,
    deleteWebsite,
    getSDKScript,
    getWebsitePages
};