import express from 'express';
import * as websiteController from '../controllers/websiteController';
import * as experimentController from '../controllers/experimentController';
import { websiteValidation, updateWebsiteValidation, validate } from '../middleware/validation';

const router = express.Router();

router.route('/')
    .get(websiteController.getWebsites)
    .post(websiteValidation, validate, websiteController.createWebsite);

router.route('/:id')
    .get(websiteController.getWebsite)
    .patch(updateWebsiteValidation, validate, websiteController.updateWebsite)
    .delete(websiteController.deleteWebsite);

router.get('/:id/sdk-script', websiteController.getSDKScript);
router.get('/:websiteId/pages', websiteController.getWebsitePages);
router.get('/:id/experiments', experimentController.getExperiments);

export default router;
