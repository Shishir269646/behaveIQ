// src/routes/fraud.routes.js
const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraudController');

router.post('/check', fraudController.checkFraud);

module.exports = router;