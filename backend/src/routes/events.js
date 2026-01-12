const express = require('express');
const router = express.Router();
console.log('Loading events routes...'); // ADDED
const { getEvents, getEventStats } = require('../controllers/eventController');
// const { protect } = require('../middleware/auth'); // Removed from here

// router.use(protect); // Moved to app.js mounting

router.get('/', getEvents);
router.get('/stats', getEventStats);

module.exports = router;