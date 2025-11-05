import { supabase } from '../supabase-client.js'

export const matchesAPI = {
  // Get all matches for current team
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          team:teams(name, acronym),
          match_players(
            *,
            player:players(name, profile_picture),
            hero:heroes(name, icon)
          )
        `)
        .order('date', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching matches:', error.message)
      throw error
    }
  },

  // Get single match by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          match_players(
            *,
            player:players(*),
            hero:heroes(*)
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching match:', error.message)
      throw error
    }
  },

  // Create new match
  async create(matchData) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating match:', error.message)
      throw error
    }
  },

  // Update match
  async update(id, matchData) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .update(matchData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating match:', error.message)
      throw error
    }
  },

  // Delete match
  async delete(id) {
    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting match:', error.message)
      throw error
    }
  },

  // Add player to match
  async addPlayer(matchId, playerData) {
    try {
      const { data, error } = await supabase
        .from('match_players')
        .insert({
          match_id: matchId,
          ...playerData
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding player to match:', error.message)
      throw error
    }
  },

  // Get recent matches (last 5)
  async getRecent(limit = 5) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching recent matches:', error.message)
      throw error
    }
  },

  // Get upcoming matches
  async getUpcoming() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching upcoming matches:', error.message)
      throw error
    }
  }
}
