import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env.local') });

const envSchema = z.object({
  PORT: z.string().default('5001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().default(process.env.VITE_SUPABASE_URL || 'https://example.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1).default(process.env.VITE_SUPABASE_ANON_KEY || 'dummy_key'),
  JWT_SECRET: z.string().min(32).default(process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  REDIS_URL: z.string().url().default('redis://127.0.0.1:6379'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
