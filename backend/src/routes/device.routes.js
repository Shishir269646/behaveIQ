// src/routes/device.routes.js
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.post('/stitch', deviceController.stitchDevices);
router.get('/user/:userId', deviceController.getUserDevices);

module.exports = router;