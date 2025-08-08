import { supabase } from './supabase'
import type { Database } from './supabase'

export type UserRole = 'system_admin' | 'manager' | 'user'
export type Profile = Database['public']['Tables']['profiles']['Row']

export const authService = {
  async signUp(email: string, password: string, fullName?: string, role: UserRole = 'user') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw error
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          role,
          full_name: fullName,
        })

      if (profileError) {
        throw profileError
      }
    }

    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw error
    }

    return user
  },

  async getCurrentProfile() {
    const user = await this.getCurrentUser()
    
    if (!user) {
      return null
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      throw error
    }

    return profile
  },

  async updateProfile(updates: Partial<Profile>) {
    const user = await this.getCurrentUser()
    
    if (!user) {
      throw new Error('Not authenticated')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  },

  async createUser(email: string, password: string, fullName: string, role: UserRole) {
    const currentProfile = await this.getCurrentProfile()
    
    if (!currentProfile || (currentProfile.role !== 'system_admin' && currentProfile.role !== 'manager')) {
      throw new Error('Insufficient permissions to create users')
    }

    if (currentProfile.role === 'manager' && role === 'system_admin') {
      throw new Error('Managers cannot create admin users')
    }

    return this.signUp(email, password, fullName, role)
  },

  async getUsersList() {
    const currentProfile = await this.getCurrentProfile()
    
    if (!currentProfile || (currentProfile.role !== 'system_admin' && currentProfile.role !== 'manager')) {
      throw new Error('Insufficient permissions to view users')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data
  },

  async updateUserRole(userId: string, newRole: UserRole) {
    const currentProfile = await this.getCurrentProfile()
    
    if (!currentProfile || currentProfile.role !== 'system_admin') {
      throw new Error('Only admins can update user roles')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  },

  async deleteUser(userId: string) {
    const currentProfile = await this.getCurrentProfile()
    
    if (!currentProfile || currentProfile.role !== 'system_admin') {
      throw new Error('Only admins can delete users')
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      throw error
    }
  }
}