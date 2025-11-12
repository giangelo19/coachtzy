// Load and display user profile information
import { supabase } from './supabase-client.js';

export async function loadUserProfile() {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No user logged in, redirecting to login...');
      window.location.href = '/login.html';
      return null;
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error loading profile:', profileError);
      // Use email as fallback
      const fallbackName = user.email.split('@')[0];
      updateUIElements(fallbackName, user.email, null);
      return { user, profile: null };
    }

    // Update UI with profile data
    const displayName = profile.username || user.email.split('@')[0];
    updateUIElements(displayName, user.email, profile.profile_picture);

    return { user, profile };

  } catch (error) {
    console.error('Error in loadUserProfile:', error);
    window.location.href = '/login.html';
    return null;
  }
}

function updateUIElements(displayName, email, profilePicture) {
  // Update display name in header
  const userDisplayName = document.getElementById('userDisplayName');
  if (userDisplayName) {
    userDisplayName.textContent = displayName;
  }

  // Update dropdown elements
  const dropdownDisplayName = document.getElementById('dropdownDisplayName');
  if (dropdownDisplayName) {
    dropdownDisplayName.textContent = displayName;
  }

  const dropdownEmail = document.getElementById('dropdownEmail');
  if (dropdownEmail) {
    dropdownEmail.textContent = email;
  }

  // Update profile images if available
  if (profilePicture) {
    const userProfileImage = document.getElementById('userProfileImage');
    if (userProfileImage) {
      userProfileImage.src = profilePicture;
    }

    const dropdownProfileImage = document.getElementById('dropdownProfileImage');
    if (dropdownProfileImage) {
      dropdownProfileImage.src = profilePicture;
    }
  }
}

// Auto-load on module import
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadUserProfile);
} else {
  loadUserProfile();
}
