const express = require('express');
const router = express.Router();
const { authController } = require('@controllers');
const { userValidation } = require('@validations');
const { authenticateJWT } = require('@middleware/authMiddleware');

// Public routes
router.post('/register', userValidation.validateSignup, authController.register);
router.post('/login', userValidation.validateLogin, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logOut);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/profile', authenticateJWT, authController.getUserProfile);

module.exports = router;
