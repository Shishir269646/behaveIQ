const express = require('express');
const router = express.Router();
const {
    getWebsites,
    createWebsite,
    getWebsite,
    updateWebsite,
    deleteWebsite,
    getSDKScript
} = require('../controllers/websiteController');
// const { protect } = require('../middleware/auth'); // Removed from here
const { websiteValidation, updateWebsiteValidation, validate } = require('../middleware/validation');

// router.use(protect); // Moved to app.js mounting

router.route('/')
    .get(getWebsites)
    .post(websiteValidation, validate, createWebsite);

router.route('/:id')
    .get(getWebsite)
    .patch(updateWebsiteValidation, validate, updateWebsite)
    .delete(deleteWebsite);

router.get('/:id/sdk-script', getSDKScript);

module.exports = router;
