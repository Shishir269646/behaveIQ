const express = require('express');
const router = express.Router({ mergeParams: true });
const { getSessions } = require('../controllers/sessionController');

router.get('/', getSessions);

module.exports = router;