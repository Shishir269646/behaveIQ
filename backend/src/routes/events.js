const express = require('express');
const router = express.Router();
const { getEvents, getEventStats } = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getEvents);
router.get('/stats', getEventStats);

module.exports = router;