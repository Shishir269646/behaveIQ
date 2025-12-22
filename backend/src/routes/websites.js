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
const { protect } = require('../middleware/auth');
const { websiteValidation, validate } = require('../middleware/validation');

router.use(protect); // All routes require authentication

router.route('/')
    .get(getWebsites)
    .post(websiteValidation, validate, createWebsite);

router.route('/:id')
    .get(getWebsite)
    .patch(updateWebsite)
    .delete(deleteWebsite);

router.get('/:id/sdk-script', getSDKScript);

module.exports = router;
