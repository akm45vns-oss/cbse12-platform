import { securityLogger } from '../utils/logger.js';

export class AuditService {
  /**
   * Logs a security-sensitive event.
   * @param {string} action - The type of event (e.g., 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'RATE_LIMIT_EXCEEDED')
   * @param {Object} req - The Express request object to extract IP and User Agent
   * @param {Object} details - Additional metadata (e.g., username, reason)
   */
  static logSecurityEvent(action, req, details = {}) {
    const logEntry = {
      action,
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      ...details
    };

    securityLogger.info(logEntry);
  }
}
