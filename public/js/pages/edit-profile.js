// Edit Profile page functionality
import { requireAuth, getCurrentUser } from '../auth.js';
import { supabase } from '../supabase-client.js';

// Protect this page
await requireAuth();

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get current user info
    currentUser = await getCurrentUser();
    
    // Load profile data into form
    await loadProfileData();
    
    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Edit profile page initialization error:', error);
  }
});

async function loadProfileData() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('No user found');
      return;
    }
    
    // Get user metadata from auth
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    // Get user profile from coaches table
    const { data: coach, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error loading coach profile:', error);
      return;
    }
    
    console.log('Loaded coach data:', coach);
    
    // Populate form fields
    document.getElementById('username').value = coach.username || '';
    document.getElementById('email').value = authUser.email || '';
    document.getElementById('bio').value = coach.bio || '';
    
    // Set profile picture
    if (coach.profile_picture) {
      document.getElementById('profilePreview').src = coach.profile_picture;
    }
    
  } catch (error) {
    console.error('Error loading user data:', error);
    showNotification('Failed to load profile data', 'error');
  }
}

function updateUserProfile(user) {
  const coachNameElements = document.querySelectorAll('.coach-name, .dropdown-name');
  const coachEmailElements = document.querySelectorAll('.dropdown-email');
  
  if (user?.username) {
    coachNameElements.forEach(el => el.textContent = user.username);
  }
  
  if (user?.email) {
    coachEmailElements.forEach(el => el.textContent = user.email);
  }
}

function showNotification(message, type = 'success') {
  // Remove any existing notifications
  const existingNotification = document.querySelector('.notification-message');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification-message ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function setupEventListeners() {
  // Profile dropdown toggle
  const userProfileBtn = document.getElementById('userProfileBtn');
  const profileDropdown = document.getElementById('profileDropdown');

  if (userProfileBtn && profileDropdown) {
    userProfileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      profileDropdown.classList.remove('show');
    });
  }

  // Profile picture upload
  const uploadBtn = document.querySelector('.upload-btn');
  const fileInput = document.getElementById('profilePictureInput');
  
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
      showNotification('Profile picture upload feature coming soon!', 'info');
    });
  }

  // Remove photo button
  const removePhotoBtn = document.querySelector('.btn-remove');
  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', handleRemovePhoto);
  }

  // Save profile button (handles both profile and password changes)
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', handleSaveAll);
  }

  // Logout button
  const logoutBtn = document.querySelector('.dropdown-item[href*="logout"]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const { logout } = await import('../auth.js');
      await logout();
      window.location.href = 'login.html';
    });
  }
}

async function handleRemovePhoto() {
  try {
    const user = await getCurrentUser();
    
    // Update to default avatar in database
    const { error } = await supabase
      .from('coaches')
      .update({ profile_picture: null })
      .eq('id', user.id);

    if (error) throw error;

    // Update UI with default avatar
    const profilePicture = document.querySelector('.profile-picture-preview');
    if (profilePicture) {
      profilePicture.src = '/assets/default-avatar.png';
    }

    showNotification('Profile picture removed successfully!', 'success');
  } catch (error) {
    console.error('Error removing profile picture:', error);
    showNotification('Failed to remove profile picture. Please try again.', 'error');
  }
}

async function handleSaveAll() {
  try {
    const user = await getCurrentUser();
    
    // Get form values
    const username = document.getElementById('username').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    // Validate username
    if (!username) {
      showNotification('Username is required', 'error');
      return;
    }

    if (username.length < 3) {
      showNotification('Username must be at least 3 characters', 'error');
      return;
    }

    // Validate password if provided
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
      }

      if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
      }
    }

    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) {
      saveBtn.textContent = 'Saving...';
      saveBtn.disabled = true;
    }

    // Update profile in coaches table
    const { error: profileError } = await supabase
      .from('coaches')
      .update({
        username: username,
        bio: bio
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Update password if provided
    if (newPassword) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (passwordError) throw passwordError;

      // Clear password fields after successful update
      if (document.getElementById('currentPassword')) document.getElementById('currentPassword').value = '';
      if (document.getElementById('newPassword')) document.getElementById('newPassword').value = '';
      if (document.getElementById('confirmPassword')) document.getElementById('confirmPassword').value = '';
    }

    showNotification('Profile updated successfully!', 'success');
    
    // Update UI elements with new username
    updateUserProfile({ username, email: user.email });

    if (saveBtn) {
      saveBtn.textContent = 'Save Changes';
      saveBtn.disabled = false;
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    showNotification('Failed to save profile. Please try again.', 'error');
    
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) {
      saveBtn.textContent = 'Save Changes';
      saveBtn.disabled = false;
    }
  }
}

// Password toggle visibility function
window.togglePassword = function(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}
