import express from 'express';
import { login, loginSchema } from '../controllers/authController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/login', authLimiter, validateRequest(loginSchema), login);

// TODO: Implement /register, /verify-otp, /forgot-password

export default router;
