import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';

// Initialize Supabase Client for backend operations
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export class UserRepository {
  static async findByUsernameOrEmail(input) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${input},email.eq.${input}`)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Rows not found"
      throw new AppError(`Database Error: ${error.message}`, 500);
    }
    
    return data || null;
  }

  static async findByUsername(username) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AppError(`Database Error: ${error.message}`, 500);
    }
    
    return data || null;
  }

  static async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create user: ${error.message}`, 500);
    }

    return data;
  }

  static async updatePasswordHash(username, newHash) {
    const { error } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('username', username);

    if (error) {
      throw new AppError(`Failed to update password hash: ${error.message}`, 500);
    }
  }

  static async updateLastLogin(username) {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('username', username);

    if (error) {
      throw new AppError(`Failed to update last login: ${error.message}`, 500);
    }
  }
}
