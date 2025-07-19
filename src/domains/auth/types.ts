// Authentication domain types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'engineer' | 'manager' | 'admin';
  plant_id: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

// Abstract interfaces following ISP
export interface AuthService {
  signIn(credentials: LoginCredentials): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  refreshSession(): Promise<User | null>;
}

export interface SessionManager {
  getSession(): Promise<any>;
  refreshSession(): Promise<any>;
  clearSession(): Promise<void>;
}

export interface UserRepository {
  getUserProfile(userId: string): Promise<User | null>;
  updateUserProfile(userId: string, updates: Partial<User>): Promise<User>;
}