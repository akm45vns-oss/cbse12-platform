import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserRepository } from '../repositories/userRepository.js';
import { AppError } from '../middlewares/errorHandler.js';

export class AuthService {
  static signToken(id) {
    return jwt.sign({ id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }

  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  }

  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static isBcryptHash(hash) {
    return /^\$2[aby]\$/.test(hash);
  }

  static async createLegacySHA256Hash(password) {
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(password));
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  static async login(usernameOrEmail, password) {
    const user = await UserRepository.findByUsernameOrEmail(usernameOrEmail);

    if (!user) {
      throw new AppError('Invalid username/email or password', 401);
    }

    let isPasswordValid = false;
    let shouldUpgradeHash = false;

    // Check if hash is bcrypt or old SHA-256
    if (this.isBcryptHash(user.password_hash)) {
      isPasswordValid = await this.verifyPassword(password, user.password_hash);
    } else {
      // Old SHA-256 hash logic for backward compatibility
      const sha256Hash = await this.createLegacySHA256Hash(password);
      isPasswordValid = sha256Hash === user.password_hash;
      
      if (isPasswordValid) {
        shouldUpgradeHash = true;
      }
    }

    if (!isPasswordValid) {
      throw new AppError('Invalid username/email or password', 401);
    }

    // Auto-upgrade hash to bcrypt
    if (shouldUpgradeHash) {
      const newHash = await this.hashPassword(password);
      await UserRepository.updatePasswordHash(user.username, newHash);
    }

    // Update last login
    await UserRepository.updateLastLogin(user.username);

    // Generate JWT token
    const token = this.signToken(user.username);

    // Filter sensitive data before returning
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }
}
