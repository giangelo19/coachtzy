import { supabase } from '../supabase-client.js'

export const matchesAPI = {
  // Get all matches for current user's team
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
        console.log('No team found, returning empty matches list')
        return []
      }
      
      // Get matches for this team
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
        .eq('team_id', team.id)
        .order('match_date', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching matches:', error.message)
      throw error
    }
  },

  // Get single match by ID
  async getById(id) {
    try {
      console.log('Fetching match with ID:', id)
      
      // Fetch match data
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single()
      
      if (matchError) throw matchError
      
      console.log('Match data:', matchData)
      
      // Fetch match_players separately
      const { data: playersData, error: playersError } = await supabase
        .from('match_players')
        .select(`
          *,
          player:players(*),
          hero:heroes(*)
        `)
        .eq('match_id', id)
        .order('is_mvp', { ascending: false })
      
      if (playersError) throw playersError
      
      console.log('Players data:', playersData)
      
      // Combine the data
      const combinedData = {
        ...matchData,
        match_players: playersData || []
      }
      
      console.log('Combined data:', combinedData)
      console.log(`Found ${playersData?.length || 0} players for match ${id}`)
      
      return combinedData
    } catch (error) {
      console.error('Error fetching match:', error.message, error)
      throw error
    }
  },

  // Create new match
  async create(matchData) {
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
      
      if (teamError) throw new Error('You must create a team first before adding matches')
      
      // Create match with team_id
      const { data, error } = await supabase
        .from('matches')
        .insert({
          ...matchData,
          team_id: team.id
        })
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
        .order('match_date', { ascending: false })
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
        .gte('match_date', today)
        .order('match_date', { ascending: true })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching upcoming matches:', error.message)
      throw error
    }
  }
}
