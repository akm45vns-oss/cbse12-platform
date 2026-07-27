import rateLimit from 'express-rate-limit';
import { AppError } from './errorHandler.js';
import { AuditService } from '../services/auditService.js';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` to allow dashboard polling
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    AuditService.logSecurityEvent('RATE_LIMIT_EXCEEDED_GLOBAL', req);
    next(new AppError('Too many requests from this IP, please try again after 15 minutes', 429));
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    AuditService.logSecurityEvent('RATE_LIMIT_EXCEEDED_AUTH', req);
    next(new AppError('Too many login attempts from this IP, please try again after 15 minutes', 429));
  }
});
