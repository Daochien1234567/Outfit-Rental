import express from 'express';
import costumeController from '../controllers/costume.controller.js';
import auth from '../middleware/auth.js';
import validation from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/', 
  validation.validatePagination,
  costumeController.getAllCostumes
);

router.get('/search', 
  costumeController.searchCostumes
);

router.get('/:id', 
  costumeController.getCostumeById
);

router.get('/:id/related', 
  costumeController.getRelatedCostumes
);

router.get('/:id/reviews', 
  validation.validatePagination,
  costumeController.getReviews
);

// Protected routes (customer)
router.post('/:id/reviews', 
  auth.authenticate,
  auth.isCustomer,
  validation.validateReview,
  costumeController.createReview
);

export default router;