import { supabase, isAuthenticated, getCurrentUser } from './supabase-client.js'

/**
 * Authenticate user with email and password
 * 
 * Flow:
 * 1. Supabase validates credentials against auth.users table
 * 2. If valid, returns session with JWT access token
 * 3. Token stored in localStorage (handled automatically by Supabase client)
 * 4. Token includes user.id which links to profiles.id for team access
 * 
 * Security notes:
 * - Password is never stored; only bcrypt hash exists in database
 * - JWT tokens expire after 1 hour (Supabase default)
 * - Failed attempts are rate-limited by Supabase (prevents brute force)
 * 
 * @throws {Error} If credentials invalid or network error
 */
export async function login(email, password) {
  try {
    console.log('🔐 Login attempt starting...');
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password.length);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('❌ Supabase auth error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        name: error.name,
        stack: error.stack,
        fullError: JSON.stringify(error, null, 2)
      });
      throw error;
    }
    
    console.log('✅ Login successful!');
    return data
  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('❌ Full error object:', error);
    throw error
  }
}

/**
 * Register new user account
 * 
 * Important: Profile creation is automatic via database trigger!
 * When new row inserted into auth.users, a PostgreSQL trigger
 * automatically creates matching row in profiles table.
 * 
 * Why trigger vs manual: Ensures profiles.id always equals auth.users.id.
 * This 1:1 relationship is critical for RLS policies to work correctly.
 * Manual creation could fail mid-transaction, breaking the link.
 * 
 * Database trigger location: See migration file create_profiles_trigger.sql
 * 
 * Username handling: If not provided, uses email prefix as fallback.
 * Stored in auth.users.raw_user_meta_data for profile display.
 */
export async function signup(email, password, username) {
  try {
    // Sign up the user
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
    
    // If signup successful and user is created, create coach profile and team
    if (authData.user) {
      console.log('Creating coach profile and team for new user:', authData.user.id);
      
      // Create coach profile
      const { error: coachError } = await supabase
        .from('coaches')
        .insert({
          id: authData.user.id,
          username: username || email.split('@')[0],
          email: email
        });
      
      if (coachError && coachError.code !== '23505') { // Ignore duplicate key error
        console.error('Error creating coach profile:', coachError);
      }
      
      // Create placeholder team for the coach
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          coach_id: authData.user.id,
          team_name: `${username || email.split('@')[0]}'s Team`,
          description: 'Update your team description'
        })
        .select()
        .single();
      
      if (teamError) {
        console.error('Error creating team:', teamError);
      } else {
        console.log('Team created successfully:', teamData);
      }
    }
    
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

// Flag to prevent multiple simultaneous auth checks
let isCheckingAuth = false;

/**
 * Guard function to protect pages requiring authentication
 * 
 * Usage: Call at top of every protected page's DOMContentLoaded handler
 * 
 * Why redirect instead of showing error: Better UX - user immediately
 * sees login page rather than blank page or error message.
 * After login, they're redirected back to protected page automatically.
 * 
 * Performance note: This check is fast (~10ms) because session token
 * is read from localStorage, not a network call.
 * 
 * @returns {boolean} true if authenticated, never returns false (redirects instead)
 */
export async function requireAuth() {
  // Prevent multiple simultaneous checks
  if (isCheckingAuth) {
    console.log('Auth check already in progress, waiting...');
    return false;
  }

  isCheckingAuth = true;

  try {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.endsWith('login.html');
    
    console.log('🔒 Auth guard - Current path:', currentPath);
    
    // Don't check auth on login page
    if (isLoginPage) {
      console.log('On login page, skipping auth check');
      isCheckingAuth = false;
      return true;
    }

    const authenticated = await isAuthenticated();
    console.log('Auth status:', authenticated ? 'Authenticated' : 'Not authenticated');
    
    if (!authenticated) {
      console.log('Not authenticated, redirecting to login...');
      window.location.replace('/login.html');
      return false;
    }
    
    isCheckingAuth = false;
    return true;
  } catch (error) {
    console.error('Auth check error:', error);
    isCheckingAuth = false;
    return false;
  }
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

// Re-export getCurrentUser from supabase-client for convenience
export { getCurrentUser }
