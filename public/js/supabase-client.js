import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from './config.js'

// Get Supabase credentials from environment variables or fallback to config
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_CONFIG.url
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey

// Debug: Log what we're getting from environment
console.log('🔍 Environment check:')
console.log('  VITE_SUPABASE_URL:', supabaseUrl)
console.log('  VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey)
console.log('  VITE_SUPABASE_ANON_KEY length:', supabaseAnonKey?.length)
console.log('  VITE_SUPABASE_ANON_KEY first 20 chars:', supabaseAnonKey?.substring(0, 20))
console.log('  VITE_SUPABASE_ANON_KEY last 20 chars:', supabaseAnonKey?.substring(supabaseAnonKey?.length - 20))

// Validate credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Please check your .env file or config.js')
  console.error('URL:', supabaseUrl)
  console.error('Key:', supabaseAnonKey ? 'Present' : 'Missing')
} else {
  console.log('✅ Supabase configured:', supabaseUrl)
  console.log('🔑 Anon key length:', supabaseAnonKey?.length)
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection immediately
console.log('🧪 Testing Supabase connection...')
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection test failed:', error)
  } else {
    console.log('✅ Supabase connection test passed')
    console.log('Session:', data.session ? 'Active' : 'None')
  }
}).catch(err => {
  console.error('❌ Supabase connection test error:', err)
})

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
