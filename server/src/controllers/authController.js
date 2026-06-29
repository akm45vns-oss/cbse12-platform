import { AuthService } from '../services/authService.js';
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    usernameOrEmail: z.string().min(1, 'Username or Email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
});

export const login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;
    
    const { user, token } = await AuthService.login(usernameOrEmail, password);

    res.status(200).json({
      status: 'success',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};
