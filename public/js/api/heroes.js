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

  // Filter heroes by role
  async getByRole(role) {
    try {
      const { data, error } = await supabase
        .from('heroes')
        .select('*')
        .eq('role', role)
        .order('name', { ascending: true })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching heroes by role:', error.message)
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
