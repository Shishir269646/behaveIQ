import express from 'express';
import * as sessionController from '../controllers/dashboardController'; // Fixed: It was actually getting sessions from dashboard in some projects, but here it is sessionController

// Based on previous file, it should be:
import { getSessions } from '../controllers/sessionController';

const router = express.Router({ mergeParams: true });

router.get('/', getSessions);

export default router;
