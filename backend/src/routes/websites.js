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
const experimentController = require('../controllers/experimentController'); // New Import
const personasRouter = require('./personas'); // Import personas router
// const { protect } = require('../middleware/auth'); // Removed from here
const { websiteValidation, updateWebsiteValidation, validate } = require('../middleware/validation');

// router.use(protect); // Moved to app.js mounting

// Re-route to other resource routers
router.use('/:id/personas', personasRouter);

router.route('/')
    .get(getWebsites)
    .post(websiteValidation, validate, createWebsite);

//router.post('/', createWebsite);

router.route('/:id')
    .get(getWebsite)
    .patch(updateWebsiteValidation, validate, updateWebsite)
    .delete(deleteWebsite);

router.get('/:id/sdk-script', getSDKScript);

// New route for experiments specific to a website
router.get('/:id/experiments', experimentController.getExperiments);

module.exports = router;
