// src/routes/discount.routes.js
const express = require('express');
const router = express.Router();
const {
    getDiscounts,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    calculateDiscount,
    applyDiscount,
    markAsUsed
} = require('../controllers/discountController');
const { protect } = require('../middleware/auth');

router.use(protect); // All discount routes require authentication

router.route('/')
    .get(getDiscounts)
    .post(createDiscount); // Route for creating a discount

router.route('/:id')
    .patch(updateDiscount) // Route for updating a discount
    .delete(deleteDiscount); // Route for deleting a discount

router.post('/calculate', calculateDiscount);
router.post('/apply', applyDiscount);
router.post('/mark-used', markAsUsed);

module.exports = router;