import { supabase } from '@/lib/supabase';

// Session management utilities (SRP - only handles session operations)
export class SessionManager {
  private static refreshTimer: NodeJS.Timeout | null = null;
  private static readonly REFRESH_MARGIN = 60 * 1000; // 1 minute before expiry

  // Start automatic session refresh
  static startAutoRefresh() {
    this.stopAutoRefresh();
    
    const scheduleRefresh = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.expires_at) {
          const expiresAt = new Date(session.expires_at * 1000);
          const now = new Date();
          const timeUntilRefresh = expiresAt.getTime() - now.getTime() - this.REFRESH_MARGIN;
          
          if (timeUntilRefresh > 0) {
            this.refreshTimer = setTimeout(async () => {
              await this.refreshSession();
              scheduleRefresh(); // Schedule next refresh
            }, timeUntilRefresh);
          } else {
            // Token is already expired or about to expire, refresh immediately
            await this.refreshSession();
            scheduleRefresh();
          }
        }
      } catch (error) {
        console.error('Failed to schedule session refresh:', error);
      }
    };

    scheduleRefresh();
  }

  // Stop automatic session refresh
  static stopAutoRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Manually refresh session
  static async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        return null;
      }
      
      return data.session;
    } catch (error) {
      console.error('Session refresh error:', error);
      return null;
    }
  }

  // Check if session is valid
  static async isSessionValid(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return false;
      }

      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      
      return expiresAt.getTime() > now.getTime();
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  // Get current session with automatic refresh if needed
  static async getCurrentSession() {
    const isValid = await this.isSessionValid();
    
    if (!isValid) {
      const refreshedSession = await this.refreshSession();
      return refreshedSession;
    }

    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
}