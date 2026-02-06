import express from 'express';
import authController from '../controllers/auth.controller.js';
import validation from '../middleware/validation.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', 
  validation.validateRegister, 
  authController.register
);

router.post('/login', 
  validation.validateLogin, 
  authController.login
);

// Protected routes
router.post('/logout', 
  auth.authenticate, 
  authController.logout
);

router.get('/profile', 
  auth.authenticate, 
  authController.getProfile
);

router.put('/profile', 
  auth.authenticate, 
  authController.updateProfile
);

router.put('/change-password', 
  auth.authenticate, 
  authController.changePassword
);

export default router;