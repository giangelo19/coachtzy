import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from './config.js'

// Get Supabase credentials from environment variables or fallback to config
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_CONFIG.url
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey

// Validate credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials!')
  console.error('Please check your .env file or config.js')
} else {
  console.log('✅ Supabase configured:', supabaseUrl)
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if user is authenticated
export async function isAuthenticated() {
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper function to get user profile
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}
