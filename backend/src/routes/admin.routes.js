import express from 'express';
import adminController from '../controllers/admin.controller.js';
import auth from '../middleware/auth.js';
import validation from '../middleware/validation.js';

const router = express.Router();

// Tất cả routes đều yêu cầu quyền admin
router.use(auth.authenticate, auth.isAdmin);

// QUẢN LÝ TRANG PHỤC 
router.get('/costumes', 
  validation.validatePagination,
  adminController.getAllCostumes
);

router.get('/costumes/:id',
  adminController.getCostumeDetail
)

router.post('/costumes', 
  adminController.createCostume
);

router.put('/costumes/:id', 
  adminController.updateCostume
);

router.delete('/costumes/:id', 
  adminController.deleteCostume
);

// QUẢN LÝ ĐƠN THUÊ 
router.get('/rentals', 
  validation.validatePagination,
  adminController.getAllRentals
);

router.get('/rentals/:id', 
  adminController.getRentalDetail
);


router.put('/rentals/:id/confirm', 
  adminController.confirmRentalDelivery
);

router.put('/rentals/:id/renting', // out_for_delivery → renting (admin xác nhận đã giao)
  adminController.confirmDelivery
);

router.put('/rentals/:id/overdue', // renting/overdue → returned (admin xác nhận quá hạn)
  adminController.completeReturn
);

router.put('/rentals/:id/completed',        // returned → completed (hoàn tất thanh toán)
  adminController.completeRental
);

router.put('/rentals/:id/checkout', 
  adminController.processReturn
);

router.post('/rentals/:id/penalty', 
  adminController.applyPenalty
);

//  QUẢN LÝ PHẠT & CỌC 
router.get('/penalties/config', 
  adminController.getPenaltyConfig
);

router.put('/penalties/config/:id', 
  adminController.updatePenaltyConfig
);

router.get('/deposits', 
  validation.validatePagination,
  adminController.getDepositHistory
);

router.post('/deposits/refund', 
  adminController.processDepositRefund
);

//BÁO CÁO 
router.get('/reports/overview', 
  adminController.getOverviewReport
);

router.get('/reports/revenue', 
  adminController.getRevenueReport
);

router.get('/reports/top-costumes', 
  adminController.getTopCostumes
);

router.get('/reports/customers', 
  adminController.getTopCustomers
);

//  QUẢN LÝ NGƯỜI DÙNG 
router.get('/users', 
  validation.validatePagination,
  adminController.getAllUsers
);

router.put('/users/:id/status', 
  adminController.updateUserStatus
);

export default router;