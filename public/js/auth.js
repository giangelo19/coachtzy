import { supabase, isAuthenticated, getCurrentUser } from './supabase-client.js'

// Login function
export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Login error:', error.message)
    throw error
  }
}

// Signup function
export async function signup(email, password, username) {
  try {
    // Sign up the user (profile will be created automatically by database trigger)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0]
        }
      }
    })
    
    if (authError) throw authError
    
    return authData
  } catch (error) {
    console.error('Signup error:', error.message)
    throw error
  }
}

// Logout function
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // Redirect to login page
    window.location.href = '/login.html'
  } catch (error) {
    console.error('Logout error:', error.message)
    throw error
  }
}

// Check authentication and redirect if not authenticated
export async function requireAuth() {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    window.location.href = '/login.html'
    return false
  }
  
  return true
}

// Get session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Listen for auth state changes
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}
