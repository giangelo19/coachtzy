import { supabase } from '../supabase-client.js'

export const teamsAPI = {
  // Get current team for logged-in coach
  async getCurrent() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('coach_id', user.id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching team:', error.message)
      throw error
    }
  },

  // Get team by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching team:', error.message)
      throw error
    }
  },

  // Create team
  async create(teamData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('teams')
        .insert({
          ...teamData,
          coach_id: user.id
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating team:', error.message)
      throw error
    }
  },

  // Update team
  async update(id, teamData) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(teamData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating team:', error.message)
      throw error
    }
  },

  // Get team statistics
  async getStats(teamId) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('total_wins, total_losses, total_matches, average_kda, winrate')
        .eq('id', teamId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching team stats:', error.message)
      throw error
    }
  },

  // Get team roster
  async getRoster(teamId) {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching team roster:', error.message)
      throw error
    }
  }
}
