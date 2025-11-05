import { supabase } from '../supabase-client.js'

export const dashboardAPI = {
  // Get dashboard data
  async getDashboardData(teamId) {
    try {
      // Get team stats
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()
      
      if (teamError) throw teamError

      // Get recent matches
      const { data: recentMatches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('team_id', teamId)
        .order('date', { ascending: false })
        .limit(5)
      
      if (matchesError) throw matchesError

      // Get upcoming matches
      const today = new Date().toISOString().split('T')[0]
      const { data: upcomingMatches, error: upcomingError } = await supabase
        .from('matches')
        .select('*')
        .eq('team_id', teamId)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(3)
      
      if (upcomingError) throw upcomingError

      // Get weekly performance
      const { data: weeklyPerformance, error: weeklyError } = await supabase
        .from('weekly_performance')
        .select('*')
        .eq('team_id', teamId)
        .order('week_start_date', { ascending: false })
        .limit(7)
      
      if (weeklyError) throw weeklyError

      return {
        team: teamData,
        recentMatches,
        upcomingMatches,
        weeklyPerformance
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error.message)
      throw error
    }
  },

  // Get team winrate breakdown
  async getWinrateData(teamId) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('total_wins, total_losses, total_matches, winrate')
        .eq('id', teamId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching winrate data:', error.message)
      throw error
    }
  }
}
