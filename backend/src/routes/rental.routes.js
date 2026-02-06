import express from 'express';
import rentalController from '../controllers/rental.controller.js';
import auth from '../middleware/auth.js';
import validation from '../middleware/validation.js';

const router = express.Router();

// Tất cả routes đều yêu cầu xác thực
router.use(auth.authenticate, auth.isCustomer);

// Tính toán trước khi thuê
router.post('/calculate', 
  validation.validateCreateRental,
  rentalController.calculateRental
);

// Tạo đơn thuê
router.post('/', 
  validation.validateCreateRental,
  rentalController.createRental
);

// Lấy lịch sử thuê
router.get('/', 
  validation.validatePagination,
  rentalController.getUserRentals
);

// Chi tiết đơn thuê
router.get('/:id', 
  rentalController.getRentalById
);

// Hủy đơn thuê
router.put('/:id/cancel', 
  rentalController.cancelRental
);

// Gia hạn đơn thuê
router.put('/:id/extend', 
  rentalController.extendRental
);

// Yêu cầu trả đồ
router.post('/:id/return', 
  rentalController.requestReturn
);

export default router;