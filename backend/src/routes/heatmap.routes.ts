import express from 'express';
import { getHeatmapData } from '../controllers/heatmapController';
import { protect } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/v1/heatmap
router.route('/').get(protect, getHeatmapData);

export default router;
