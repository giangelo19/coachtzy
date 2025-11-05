import { supabase } from '../supabase-client.js'

export const draftsAPI = {
  // Get all drafts for current team
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select(`
          *,
          draft_picks(
            *,
            hero:heroes(*)
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching drafts:', error.message)
      throw error
    }
  },

  // Get single draft by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select(`
          *,
          draft_picks(
            *,
            hero:heroes(*)
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching draft:', error.message)
      throw error
    }
  },

  // Create new draft
  async create(draftData) {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .insert(draftData)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating draft:', error.message)
      throw error
    }
  },

  // Update draft
  async update(id, draftData) {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .update(draftData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating draft:', error.message)
      throw error
    }
  },

  // Delete draft
  async delete(id) {
    try {
      const { error } = await supabase
        .from('drafts')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting draft:', error.message)
      throw error
    }
  },

  // Add pick/ban to draft
  async addPick(draftId, pickData) {
    try {
      const { data, error } = await supabase
        .from('draft_picks')
        .insert({
          draft_id: draftId,
          ...pickData
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding pick to draft:', error.message)
      throw error
    }
  },

  // Remove pick/ban from draft
  async removePick(pickId) {
    try {
      const { error } = await supabase
        .from('draft_picks')
        .delete()
        .eq('id', pickId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error removing pick from draft:', error.message)
      throw error
    }
  },

  // Get all heroes
  async getAllHeroes() {
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
  }
}
