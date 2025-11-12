import { supabase } from '../supabase-client.js'

export const playersAPI = {
  // Get all players for the current team
  async getAll() {
    try {
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
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
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
      const { data, error } = await supabase
        .from('players')
        .insert(playerData)
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
