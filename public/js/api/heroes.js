import { supabase } from '../supabase-client.js'

export const heroesAPI = {
  // Get all heroes
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('heroes')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching heroes:', error.message)
      throw error
    }
  },

  // Get hero by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('heroes')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching hero:', error.message)
      throw error
    }
  },

  // Filter heroes by role (checks both role1 and role2)
  async getByRole(role) {
    try {
      const { data, error } = await supabase
        .from('heroes')
        .select('*')
        .or(`role1.eq.${role},role2.eq.${role}`)
        .eq('is_available', true)
        .order('name', { ascending: true })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching heroes by role:', error.message)
      throw error
    }
  },

  // Get available heroes only
  async getAvailable() {
    try {
      const { data, error } = await supabase
        .from('heroes')
        .select('*')
        .eq('is_available', true)
        .order('name', { ascending: true })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching available heroes:', error.message)
      throw error
    }
  },

  // Search heroes by name
  async search(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('heroes')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error searching heroes:', error.message)
      throw error
    }
  }
}
