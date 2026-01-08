// src/routes/fraud.routes.js
const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraudController');
const { protect } = require('../middleware/auth'); // Assuming protect middleware is needed

router.get('/', protect, fraudController.getFraudEvents); // ADDED: Route to get all fraud events
router.post('/check', fraudController.checkFraud);

module.exports = router;