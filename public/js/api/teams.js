import { supabase } from '../supabase-client.js'

export const teamsAPI = {
  
  /**
   * Get the authenticated coach's team
   * 
   * Critical relationship: teams.coach_id -> profiles.id -> auth.users.id
   * This 3-table chain is why authentication is required everywhere.
   * 
   * RLS Policy (database enforced):
   * - SELECT allowed WHERE coach_id = auth.uid()
   * - Coach can only see their own team, never other coaches' teams
   * 
   * Why maybeSingle(): New coaches might not have created team yet.
   * Returns null (not error) if no team exists, allowing "Create Team" flow.
   * 
   * Design decision: Teams don't embed players to avoid nested query complexity.
   * Use playersAPI.getAll() separately for better performance and caching.
   */

  async getCurrent() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) throw new Error('User not authenticated')
      
      // Get team by coach_id (user.id is same as profile.id)
      // Don't fetch players here - use playersAPI.getAll() instead
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('coach_id', user.id)
        .maybeSingle()
      
      if (teamError && teamError.code !== 'PGRST116') {
        console.error('Error fetching team:', teamError)
        throw teamError
      }
      
      // If no team exists, return null
      if (!team) {
        console.log('No team found for user:', user.id)
        return null
      }
      
      console.log('Team found:', team)
      
      return team
    } catch (error) {
      console.error('Error fetching team:', error.message)
      return null
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

  /**
   * Create new team for authenticated coach
   * 
   * Business rule: One team per coach (enforced in code, not database constraint)
   * 
   * Why not database constraint: Allows future feature where coaches could
   * transfer teams or archive old teams. Enforcing in code gives flexibility.
   * 
   * Constraint check: Queries for existing team before insert.
   * Race condition possible (multiple rapid creates) but unlikely in practice
   * since team creation is rare, manual operation.
   * 
   * coach_id auto-populated: User can't choose which coach to create for.
   * Always uses auth.uid(), preventing impersonation.
   */
  
  async create(teamData) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) throw new Error('User not authenticated')
      
      // Check if user already has a team
      const existingTeam = await this.getCurrent()
      if (existingTeam) {
        throw new Error('You already have a team. Each coach can only have one team.')
      }
      
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
