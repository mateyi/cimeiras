// src/routes/userRoutes.js
const express = require('express');
const router  = express.Router();

const { register, login, getMe, verifyEmail, resendVerification } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../middleware/validate');

router.post('/register',            validate(registerSchema), register);
router.post('/login',               validate(loginSchema),    login);
router.get('/verify-email',         verifyEmail);
router.post('/resend-verification', resendVerification);
router.get('/me',                   authenticate, getMe);

module.exports = router;