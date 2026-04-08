import express from 'express';
import * as discountController from '../controllers/discountController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(discountController.getDiscounts)
    .post(discountController.createDiscount);

router.route('/:id')
    .patch(discountController.updateDiscount)
    .delete(discountController.deleteDiscount);

router.post('/calculate', discountController.calculateDiscount);
router.post('/apply', discountController.applyDiscount);
router.post('/mark-used', discountController.markAsUsed);

export default router;
