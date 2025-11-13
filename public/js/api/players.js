import { supabase } from '../supabase-client.js'

export const playersAPI = {
  // Get all players for the current user's team
  async getAll() {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User not authenticated')
      
      // Get user's team first
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('coach_id', user.id)
        .maybeSingle()
      
      if (teamError && teamError.code !== 'PGRST116') throw teamError
      
      // If no team, return empty array
      if (!team) {
        console.log('No team found, returning empty players list')
        return []
      }
      
      // Get players for this team
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(name, acronym),
          player_heroes(
            id,
            games_played,
            wins,
            losses,
            winrate,
            average_kda,
            hero:heroes(
              id,
              name,
              role1,
              role2,
              icon
            )
          )
        `)
        .eq('team_id', team.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching players:', error.message)
      throw error
    }
  },

  // Get single player by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(*),
          player_heroes(
            id,
            games_played,
            wins,
            losses,
            winrate,
            average_kda,
            hero:heroes(
              id,
              name,
              role1,
              role2,
              icon
            )
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching player:', error.message)
      throw error
    }
  },

  // Create new player
  async create(playerData) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User not authenticated')
      
      // Get user's team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('coach_id', user.id)
        .single()
      
      if (teamError) throw new Error('You must create a team first before adding players')
      
      // Create player with team_id
      const { data, error } = await supabase
        .from('players')
        .insert({
          ...playerData,
          team_id: team.id
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating player:', error.message)
      throw error
    }
  },

  // Update player
  async update(id, playerData) {
    try {
      const { data, error } = await supabase
        .from('players')
        .update(playerData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating player:', error.message)
      throw error
    }
  },

  // Delete player
  async delete(id) {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting player:', error.message)
      throw error
    }
  },

  // Add hero to player
  async addHero(playerId, heroId, stats = {}) {
    try {
      const { data, error } = await supabase
        .from('player_heroes')
        .insert({
          player_id: playerId,
          hero_id: heroId,
          games_played: stats.games_played || 0,
          wins: stats.wins || 0,
          losses: stats.losses || 0,
          average_kda: stats.average_kda || 0
        })
        .select(`
          *,
          hero:heroes(
            id,
            name,
            role1,
            role2,
            icon
          )
        `)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding hero to player:', error.message)
      throw error
    }
  },

  // Remove hero from player
  async removeHero(playerId, heroId) {
    try {
      const { error } = await supabase
        .from('player_heroes')
        .delete()
        .eq('player_id', playerId)
        .eq('hero_id', heroId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error removing hero from player:', error.message)
      throw error
    }
  }
}
