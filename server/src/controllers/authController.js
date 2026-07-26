import { AuthService } from '../services/authService.js';
import { AuditService } from '../services/auditService.js';
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    usernameOrEmail: z.string().min(1, 'Username or Email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
});

export const login = async (req, res, next) => {
  const { usernameOrEmail, password } = req.body;
  try {
    const { user, token } = await AuthService.login(usernameOrEmail, password);

    AuditService.logSecurityEvent('LOGIN_SUCCESS', req, { username: user.username });

    res.status(200).json({
      status: 'success',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    if (error.statusCode === 401) {
      AuditService.logSecurityEvent('LOGIN_FAILED', req, { 
        usernameOrEmail, 
        reason: error.message 
      });
    }
    next(error);
  }
};
