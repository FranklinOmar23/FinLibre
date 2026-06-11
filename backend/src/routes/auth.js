const router = require('express').Router();
const {
  register, login, googleLogin, refresh, logout, me,
  forgotPassword, resetPassword, verifyEmail, resendVerification,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register',             register);
router.post('/login',                login);
router.post('/google',               googleLogin);
router.post('/refresh',              refresh);
router.post('/logout',               logout);
router.get('/me',                    authMiddleware, me);
router.post('/forgot-password',      forgotPassword);
router.post('/reset-password',       resetPassword);
router.get('/verify-email/:token',   verifyEmail);
router.post('/resend-verification',  authMiddleware, resendVerification);

module.exports = router;
