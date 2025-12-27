// src/routes/discount.routes.js
const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');

router.post('/calculate', discountController.calculateDiscount);
router.post('/apply', discountController.applyDiscount);
router.post('/mark-used', discountController.markAsUsed);

module.exports = router;