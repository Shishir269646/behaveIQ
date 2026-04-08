import express from 'express';
import {
    getWebsites,
    createWebsite,
    getWebsite,
    updateWebsite,
    deleteWebsite,
    getSDKScript,
    getWebsitePages
} from '../controllers/websiteController';
import * as experimentController from '../controllers/experimentController';
import personasRouter from './personas.routes';
import sessionRoutes from './session.routes';
import { websiteValidation, updateWebsiteValidation, validate } from '../middleware/validation';

const router = express.Router();

// Re-route to other resource routers
router.use('/:websiteId/personas', personasRouter);
router.use('/:websiteId/sessions', sessionRoutes);

router.route('/')
    .get(getWebsites)
    .post(websiteValidation, validate, createWebsite);

router.route('/:id')
    .get(getWebsite)
    .patch(updateWebsiteValidation, validate, updateWebsite)
    .delete(deleteWebsite);

router.get('/:id/sdk-script', getSDKScript);

// New route to get all unique page URLs for a website
router.get('/:websiteId/pages', getWebsitePages);

// New route for experiments specific to a website
router.get('/:id/experiments', experimentController.getExperiments);

export default router;
