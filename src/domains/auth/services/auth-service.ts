import { supabase } from '@/lib/supabase';
import type { AuthService, LoginCredentials, User, SessionManager, UserRepository } from '../types';

// Concrete implementation of SessionManager (SRP)
export class SupabaseSessionManager implements SessionManager {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  }

  async clearSession() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}

// Concrete implementation of UserRepository (SRP)
export class SupabaseUserRepository implements UserRepository {
  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return data;
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Main AuthService implementation (DIP - depends on abstractions)
export class SupabaseAuthService implements AuthService {
  constructor(
    private sessionManager: SessionManager,
    private userRepository: UserRepository
  ) {}

  async signIn(credentials: LoginCredentials): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('로그인에 실패했습니다.');
    }

    // Get user profile from our users table
    const userProfile = await this.userRepository.getUserProfile(data.user.id);
    
    if (!userProfile) {
      throw new Error('사용자 프로필을 찾을 수 없습니다.');
    }

    return userProfile;
  }

  async signOut(): Promise<void> {
    await this.sessionManager.clearSession();
  }

  async getCurrentUser(): Promise<User | null> {
    const session = await this.sessionManager.getSession();
    
    if (!session?.user) {
      return null;
    }

    return await this.userRepository.getUserProfile(session.user.id);
  }

  async refreshSession(): Promise<User | null> {
    try {
      const session = await this.sessionManager.refreshSession();
      
      if (!session?.user) {
        return null;
      }

      return await this.userRepository.getUserProfile(session.user.id);
    } catch (error) {
      console.error('Session refresh failed:', error);
      return null;
    }
  }
}

// Factory function for dependency injection (DIP)
export function createAuthService(): AuthService {
  const sessionManager = new SupabaseSessionManager();
  const userRepository = new SupabaseUserRepository();
  return new SupabaseAuthService(sessionManager, userRepository);
}