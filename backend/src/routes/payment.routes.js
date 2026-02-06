import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import auth from '../middleware/auth.js';
import validation from '../middleware/validation.js';

const router = express.Router();

// Protected routes (customer)
router.post('/', 
  auth.authenticate,
  paymentController.createPayment
);

router.get('/:id', 
  auth.authenticate,
  paymentController.checkPaymentStatus
);

// Public webhook (không cần auth)
router.post('/webhook/:payment_method', 
  paymentController.handlePaymentWebhook
);

// Admin routes cho hoàn tiền
router.post('/refund', 
  auth.authenticate,
  auth.isAdmin,
  paymentController.processRefund
);

export default router;