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
    loadProfileData(currentUser);
    
    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Edit profile page initialization error:', error);
  }
});

function loadProfileData(user) {
  if (!user) return;

  // Update header user info
  updateUserProfile(user);

  // Personal Information
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const bioTextarea = document.getElementById('bio');
  const experienceSelect = document.getElementById('experience');

  if (usernameInput) usernameInput.value = user.username || '';
  if (emailInput) emailInput.value = user.email || '';
  if (phoneInput) phoneInput.value = user.phone_number || '';
  if (bioTextarea) bioTextarea.value = user.bio || '';
  if (experienceSelect) experienceSelect.value = user.experience_level || '';

  // Profile picture
  const profilePicture = document.querySelector('.profile-picture-preview');
  if (profilePicture && user.profile_picture) {
    profilePicture.src = user.profile_picture;
  }

  // Preferences
  const timezoneSelect = document.getElementById('timezone');
  const languageSelect = document.getElementById('language');
  const emailNotifications = document.getElementById('emailNotifications');
  const matchReminders = document.getElementById('matchReminders');
  const performanceReports = document.getElementById('performanceReports');
  const draftAlerts = document.getElementById('draftAlerts');

  if (timezoneSelect) timezoneSelect.value = user.timezone || 'UTC';
  if (languageSelect) languageSelect.value = user.language || 'en';
  if (emailNotifications) emailNotifications.checked = user.email_notifications !== false;
  if (matchReminders) matchReminders.checked = user.match_reminders !== false;
  if (performanceReports) performanceReports.checked = user.performance_reports !== false;
  if (draftAlerts) draftAlerts.checked = user.draft_alerts !== false;
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
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleProfilePictureUpload);
  }

  // Personal Information form
  const personalInfoForm = document.querySelector('.personal-info-form');
  if (personalInfoForm) {
    personalInfoForm.addEventListener('submit', handlePersonalInfoSave);
  }

  // Password change form
  const passwordForm = document.querySelector('.password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', handlePasswordChange);
  }

  // Preferences form
  const preferencesForm = document.querySelector('.preferences-form');
  if (preferencesForm) {
    preferencesForm.addEventListener('submit', handlePreferencesSave);
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

async function handleProfilePictureUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    return;
  }

  try {
    // Show loading
    const uploadBtn = document.querySelector('.upload-btn');
    if (uploadBtn) uploadBtn.textContent = 'Uploading...';

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;

    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    // Update profile in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_picture: publicUrl })
      .eq('id', currentUser.id);

    if (updateError) throw updateError;

    // Update UI
    const profilePicture = document.querySelector('.profile-picture-preview');
    if (profilePicture) profilePicture.src = publicUrl;

    alert('Profile picture updated successfully!');
    
    if (uploadBtn) uploadBtn.textContent = 'Upload New Photo';
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    alert('Failed to upload profile picture. Please try again.');
    const uploadBtn = document.querySelector('.upload-btn');
    if (uploadBtn) uploadBtn.textContent = 'Upload New Photo';
  }
}

async function handlePersonalInfoSave(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const updates = {
    username: formData.get('username'),
    phone_number: formData.get('phone'),
    bio: formData.get('bio'),
    experience_level: formData.get('experience')
  };

  try {
    const saveBtn = event.target.querySelector('button[type="submit"]');
    if (saveBtn) saveBtn.textContent = 'Saving...';

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', currentUser.id);

    if (error) throw error;

    alert('Profile updated successfully!');
    
    // Reload user data
    currentUser = await getCurrentUser();
    updateUserProfile(currentUser);

    if (saveBtn) saveBtn.textContent = 'Save Changes';
  } catch (error) {
    console.error('Error saving profile:', error);
    alert('Failed to save profile. Please try again.');
    const saveBtn = event.target.querySelector('button[type="submit"]');
    if (saveBtn) saveBtn.textContent = 'Save Changes';
  }
}

async function handlePasswordChange(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');

  // Validate
  if (newPassword !== confirmPassword) {
    alert('New passwords do not match');
    return;
  }

  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  try {
    const saveBtn = event.target.querySelector('button[type="submit"]');
    if (saveBtn) saveBtn.textContent = 'Changing...';

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    alert('Password changed successfully!');
    event.target.reset();

    if (saveBtn) saveBtn.textContent = 'Change Password';
  } catch (error) {
    console.error('Error changing password:', error);
    alert('Failed to change password. Please try again.');
    const saveBtn = event.target.querySelector('button[type="submit"]');
    if (saveBtn) saveBtn.textContent = 'Change Password';
  }
}

async function handlePreferencesSave(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const updates = {
    timezone: formData.get('timezone'),
    language: formData.get('language'),
    email_notifications: formData.get('emailNotifications') === 'on',
    match_reminders: formData.get('matchReminders') === 'on',
    performance_reports: formData.get('performanceReports') === 'on',
    draft_alerts: formData.get('draftAlerts') === 'on'
  };

  try {
    const saveBtn = event.target.querySelector('button[type="submit"]');
    if (saveBtn) saveBtn.textContent = 'Saving...';

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', currentUser.id);

    if (error) throw error;

    alert('Preferences updated successfully!');

    if (saveBtn) saveBtn.textContent = 'Save Preferences';
  } catch (error) {
    console.error('Error saving preferences:', error);
    alert('Failed to save preferences. Please try again.');
    const saveBtn = event.target.querySelector('button[type="submit"]');
    if (saveBtn) saveBtn.textContent = 'Save Preferences';
  }
}
