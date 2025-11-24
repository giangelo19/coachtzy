// Team page functionality
console.log('🚀 Team.js is loading...');

import { requireAuth, getCurrentUser } from '../auth.js';
import { teamsAPI } from '../api/teams.js';
import { playersAPI } from '../api/players.js';
import { matchesAPI } from '../api/matches.js';
import { supabase } from '../supabase-client.js';

console.log('✅ Imports loaded successfully');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 DOM Content Loaded event fired');
  
  try {
    // Protect this page
    console.log('🔒 Checking authentication...');
    await requireAuth();
    console.log('✅ Authentication passed');
    
    // Get current user info
    console.log('👤 Getting current user...');
    const user = await getCurrentUser();
    console.log('User:', user);
    updateUserProfile(user);

    // Load team data
    console.log('🏀 Loading team data...');
    await loadTeamData();
    
    // Setup event listeners
    console.log('🎯 Setting up event listeners...');
    setupEventListeners();
    
    console.log('✅ Team page initialized successfully!');
  } catch (error) {
    console.error('❌ Team page initialization error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
});

/**
 * Load and display all team data from database
 * 
 * Data loading order is intentional:
 * 1. Team info (needed for RLS - all subsequent queries filter by team_id)
 * 2. Players (needed to show roster count in team header)
 * 3. Matches (needed to calculate win/loss stats and weekly KDA chart)
 * 
 * Why this order: RLS policies require team_id from authenticated coach.
 * Getting team first establishes identity for subsequent filtered queries.
 * 
 * Performance note: All queries run sequentially (not parallel) because
 * team_id is needed before players/matches can be fetched with RLS.
 */
async function loadTeamData() {
  try {
    console.log('=== Starting loadTeamData ===');
    showLoading();

    // Get current user's team
    console.log('Fetching team...');
    const team = await teamsAPI.getCurrent();
    console.log('Team result:', team);

    if (team) {
      console.log('Team found, loading data...');
      
      // Load players first to get count
      console.log('Fetching players...');
      const players = await playersAPI.getAll();
      console.log('Players result:', players);
      console.log('Number of players:', players ? players.length : 0);
      
      // Update team profile with player count
      updateTeamProfile(team, players ? players.length : 0);
      
      // Fetch matches to calculate stats
      console.log('Fetching matches...');
      const matches = await matchesAPI.getAll();
      console.log('Matches result:', matches);
      console.log('Number of matches:', matches ? matches.length : 0);
      
      // Calculate stats from matches
      const stats = calculateTeamStats(matches || []);
      console.log('Calculated stats:', stats);
      updateTeamStats(stats);
      
      // Calculate and update weekly performance
      const weeklyData = calculateWeeklyPerformance(matches || []);
      console.log('Weekly performance data:', weeklyData);
      updateWeeklyPerformanceChart(weeklyData);
      
      // Update roster
      updateRoster(players || []);
    } else {
      console.log('No team found, showing no team message');
      showNoTeamMessage();
    }

    hideLoading();
    console.log('=== loadTeamData complete ===');
  } catch (error) {
    console.error('Error loading team data:', error);
    console.error('Error stack:', error.stack);
    showError('Failed to load team data. Please refresh the page.');
    hideLoading();
  }
}

/**
 * Calculate aggregate team statistics from match history
 * 
 * Stats computed:
 * - Total Wins: Count where result === 'win' (case-insensitive)
 * - Total Losses: Count where result === 'loss'
 * - Average KDA: Sum of all average_kda / total matches
 * - Win Rate: (wins / total matches) * 100, rounded to 1 decimal
 * 
 * Why recalculate on every load: Ensures stats are always current.
 * No caching needed since query is fast (<100ms for typical team).
 * 
 * Edge case: Empty matches return zeros (safe for new teams).
 * This prevents division by zero and displays cleanly on dashboard.
 */
function calculateTeamStats(matches) {
  if (!matches || matches.length === 0) {
    return {
      total_wins: 0,
      total_losses: 0,
      total_matches: 0,
      average_kda: 0,
      winrate: 0
    };
  }
  
  const total_wins = matches.filter(m => m.result === 'win').length;
  const total_losses = matches.filter(m => m.result === 'loss').length;
  const total_matches = matches.length;
  
  // Calculate average KDA from all matches
  const totalKDA = matches.reduce((sum, match) => {
    return sum + (match.average_kda || 0);
  }, 0);
  const average_kda = total_matches > 0 ? totalKDA / total_matches : 0;
  
  // Calculate winrate
  const winrate = total_matches > 0 ? (total_wins / total_matches) * 100 : 0;
  
  return {
    total_wins,
    total_losses,
    total_matches,
    average_kda,
    winrate
  };
}

/**
 * Calculate daily average KDA for the last 7 days (for line chart)
 * 
 * Why 7 days: Provides recent performance trend without overwhelming detail.
 * Coaches can spot patterns (bad weekends, practice improvements, etc.)
 * 
 * Algorithm:
 * 1. Create array of last 7 days (today - 6 through today)
 * 2. Group matches by date (YYYY-MM-DD format)
 * 3. Calculate mean KDA for each day
 * 
 * Edge cases handled:
 * - Days with no matches show 0 KDA (chart displays as data point at bottom)
 * - Match dates are ISO timestamps; we extract just date part for grouping
 * - Prevents date mismatch bugs (was issue: full timestamp wouldn't match date string)
 * 
 * Performance: O(n*m) where n=7 days, m=matches. Fast for typical <100 matches.
 */


function calculateWeeklyPerformance(matches) {
  // Get last 7 days
  const today = new Date();
  const last7Days = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    last7Days.push({
      date: dateStr,
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      matches: [],
      avgKDA: 0
    });
  }
  
  // Group matches by date
  matches.forEach(match => {
    // Extract just the date part (YYYY-MM-DD) from the match_date
    const matchDate = match.match_date ? match.match_date.split('T')[0] : null;
    const dayData = last7Days.find(d => d.date === matchDate);
    
    if (dayData) {
      dayData.matches.push(match);
    }
  });
  
  // Calculate average KDA for each day
  last7Days.forEach(day => {
    if (day.matches.length > 0) {
      const totalKDA = day.matches.reduce((sum, match) => sum + (match.average_kda || 0), 0);
      day.avgKDA = totalKDA / day.matches.length;
    }
  });
  
  return last7Days;
}

function updateWeeklyPerformanceChart(weeklyData) {
  console.log('Updating weekly performance chart with:', weeklyData);
  
  // Update chart labels (dates)
  const labels = document.querySelectorAll('.chart-x-axis span');
  weeklyData.forEach((day, index) => {
    if (labels[index]) {
      labels[index].textContent = day.displayDate;
    }
  });
  
  // Update the SVG path with actual data
  const svg = document.querySelector('.line-chart');
  if (!svg) return;
  
  // Calculate points for the line chart
  const chartWidth = 700;
  const chartHeight = 200;
  const padding = 20; // Add padding so points aren't cut off
  const maxKDA = Math.max(...weeklyData.map(d => d.avgKDA), 10); // Min scale of 10
  const minKDA = 0;
  
  // Calculate point positions
  const pointsData = weeklyData.map((day, index) => {
    const x = (index / (weeklyData.length - 1)) * chartWidth;
    const ratio = (day.avgKDA - minKDA) / (maxKDA - minKDA);
    const y = chartHeight - (ratio * (chartHeight - padding)) - (padding / 2);
    return { x, y, kda: day.avgKDA, matches: day.matches.length };
  });
  
  const points = pointsData.map(p => `${p.x},${p.y}`).join(' ');
  
  // Remove old elements
  svg.querySelectorAll('.kda-line, .kda-area, .data-point, .data-point-hover').forEach(el => el.remove());
  
  // Create the filled area (add first for proper z-ordering)
  const areaPoints = `0,${chartHeight} ${points} ${chartWidth},${chartHeight}`;
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.classList.add('kda-area');
  polygon.setAttribute('fill', 'url(#teamLineGradient)');
  polygon.setAttribute('points', areaPoints);
  svg.appendChild(polygon);
  
  // Create the line with smooth curve
  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.classList.add('kda-line');
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', 'var(--accent-orange)');
  polyline.setAttribute('stroke-width', '3');
  polyline.setAttribute('stroke-linecap', 'round');
  polyline.setAttribute('stroke-linejoin', 'round');
  polyline.setAttribute('points', points);
  svg.appendChild(polyline);
  
  // Add data points (circles)
  pointsData.forEach((point, index) => {
    // Main circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.classList.add('data-point');
    circle.setAttribute('cx', point.x);
    circle.setAttribute('cy', point.y);
    circle.setAttribute('r', point.matches > 0 ? '5' : '3');
    circle.setAttribute('fill', 'var(--accent-orange)');
    circle.setAttribute('stroke', 'var(--bg-card)');
    circle.setAttribute('stroke-width', '2');
    circle.style.animationDelay = `${0.8 + index * 0.1}s`; // Stagger animation
    
    // Add hover effect
    const hoverCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hoverCircle.classList.add('data-point-hover');
    hoverCircle.setAttribute('cx', point.x);
    hoverCircle.setAttribute('cy', point.y);
    hoverCircle.setAttribute('r', '8');
    hoverCircle.setAttribute('fill', 'transparent');
    hoverCircle.setAttribute('cursor', 'pointer');
    
    // Add tooltip on hover
    hoverCircle.addEventListener('mouseenter', (e) => {
      circle.setAttribute('r', '7');
      showTooltip(point, e);
    });
    
    hoverCircle.addEventListener('mouseleave', () => {
      circle.setAttribute('r', point.matches > 0 ? '5' : '3');
      hideTooltip();
    });
    
    if (point.matches > 0) {
      svg.appendChild(circle);
      svg.appendChild(hoverCircle);
    }
  });
  
  console.log('Chart updated with', pointsData.length, 'data points');
}

function showTooltip(point, event) {
  // Create or update tooltip
  let tooltip = document.querySelector('.chart-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    document.body.appendChild(tooltip);
  }
  
  tooltip.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">KDA: ${point.kda.toFixed(2)}</div>
    <div style="font-size: 12px; color: var(--text-secondary);">${point.matches} match${point.matches !== 1 ? 'es' : ''}</div>
  `;
  
  tooltip.style.display = 'block';
  tooltip.style.left = `${event.pageX + 10}px`;
  tooltip.style.top = `${event.pageY - 40}px`;
}

function hideTooltip() {
  const tooltip = document.querySelector('.chart-tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

function updateTeamProfile(team, playerCount = 0) {
  const teamNameEl = document.getElementById('teamName');
  const teamAcronymEl = document.getElementById('teamAcronym');
  const teamLogoEl = document.getElementById('teamLogo');
  const establishedYearEl = document.getElementById('establishedYear');
  const countryEl = document.getElementById('teamCountry');
  const playerCountEl = document.getElementById('playerCount');

  if (teamNameEl) teamNameEl.textContent = team.name || 'Team Name';
  if (teamAcronymEl) teamAcronymEl.textContent = team.acronym || 'TM';
  if (teamLogoEl) {
    if (team.logo) {
      teamLogoEl.src = team.logo;
      teamLogoEl.style.display = 'block';
    } else {
      teamLogoEl.src = '/assets/logo.png'; // Fallback logo
    }
  }
  if (establishedYearEl) establishedYearEl.textContent = `Est. ${team.established_year || '-'}`;
  if (countryEl) countryEl.textContent = team.country || '-';
  if (playerCountEl) playerCountEl.textContent = `${playerCount} Player${playerCount !== 1 ? 's' : ''}`;
  
  console.log('Team profile updated:', {
    name: team.name,
    acronym: team.acronym,
    logo: team.logo,
    playerCount,
    established: team.established_year,
    country: team.country
  });
}

function updateTeamStats(stats) {
  if (!stats) return;

  console.log('Updating team stats with:', stats);

  const totalWinsEl = document.querySelector('.wins-card .stat-value');
  const totalLossesEl = document.querySelector('.losses-card .stat-value');
  const avgKdaEl = document.querySelector('.kda-card .stat-value');
  const winrateEl = document.querySelector('.winrate-card .stat-value');

  console.log('Elements found:', { totalWinsEl, totalLossesEl, avgKdaEl, winrateEl });

  if (totalWinsEl) {
    totalWinsEl.textContent = stats.total_wins || 0;
    console.log('Updated wins to:', stats.total_wins);
  }
  if (totalLossesEl) {
    totalLossesEl.textContent = stats.total_losses || 0;
    console.log('Updated losses to:', stats.total_losses);
  }
  if (avgKdaEl) {
    avgKdaEl.textContent = (stats.average_kda || 0).toFixed(2);
    console.log('Updated KDA to:', (stats.average_kda || 0).toFixed(2));
  }
  if (winrateEl) {
    winrateEl.textContent = `${(stats.winrate || 0).toFixed(1)}%`;
    console.log('Updated winrate to:', `${(stats.winrate || 0).toFixed(1)}%`);
  }
}

function updateRoster(roster) {
  console.log('updateRoster called with:', roster);
  
  const rosterContainer = document.getElementById('rosterList');
  const rosterCount = document.getElementById('rosterCount');
  
  console.log('rosterContainer element:', rosterContainer);
  console.log('rosterCount element:', rosterCount);
  
  if (!rosterContainer) {
    console.error('rosterList element not found!');
    return;
  }

  // Update roster count
  if (rosterCount) {
    rosterCount.textContent = `${roster ? roster.length : 0} Players`;
  }

  if (!roster || roster.length === 0) {
    console.log('No roster data, showing empty message');
    rosterContainer.innerHTML = '<p class="no-data" style="padding: 2rem; text-align: center; color: var(--text-secondary);">No players in roster. Add players from the Players tab to get started.</p>';
    return;
  }

  console.log('Rendering', roster.length, 'players');
  rosterContainer.innerHTML = roster.map(player => {
    const kda = player.average_kda || 0;
    const winrate = player.winrate || 0;
    const winrateClass = winrate >= 50 ? 'success' : 'error';
    
    return `
      <div class="roster-player">
        <img src="${player.profile_picture || '../assets/default_pfp.png'}" alt="${player.name}" class="roster-avatar" />
        <div class="roster-player-info">
          <span class="roster-player-name">${player.name}</span>
          <div class="roster-player-role">
            <img src="../assets/${getRoleIcon(player.role)}" alt="${formatRole(player.role)}" class="roster-role-icon" />
            <span>${formatRole(player.role)}</span>
          </div>
        </div>
        <div class="roster-stats">
          <div class="roster-stat">
            <span class="stat-label-small">KDA</span>
            <span class="stat-value-small">${kda.toFixed(2)}</span>
          </div>
          <div class="roster-stat">
            <span class="stat-label-small">WR</span>
            <span class="stat-value-small ${winrateClass}">${winrate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getRoleIcon(role) {
  const icons = {
    'exp_lane': 'expLane.png',
    'jungle': 'jungle.png',
    'mid_lane': 'midLane.png',
    'gold_lane': 'goldLane.png',
    'roam': 'roam.png'
  };
  return icons[role] || 'default_pfp.png';
}

function formatRole(role) {
  const roleMap = {
    'exp_lane': 'EXP Lane',
    'jungle': 'Jungle',
    'mid_lane': 'Mid Lane',
    'gold_lane': 'Gold Lane',
    'roam': 'Roam'
  };
  return roleMap[role] || role;
}

function showNoTeamMessage() {
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="no-team-message">
        <h2>No Team Created</h2>
        <p>Create a team to start managing your roster and tracking performance.</p>
        <button class="btn-primary" onclick="createTeam()">Create Team</button>
      </div>
    `;
  }
}

window.createTeam = function() {
  // TODO: Open create team modal
  alert('Create team functionality coming soon!');
};

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

  // Edit team button
  const editTeamBtn = document.getElementById('editTeamBtn');
  if (editTeamBtn) {
    editTeamBtn.addEventListener('click', openEditTeamModal);
  }

  // Edit team modal controls
  const closeEditModal = document.getElementById('closeEditModal');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const editTeamModal = document.getElementById('editTeamModal');
  
  if (closeEditModal) {
    closeEditModal.addEventListener('click', closeEditTeamModal);
  }
  
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', closeEditTeamModal);
  }
  
  if (editTeamModal) {
    editTeamModal.addEventListener('click', (e) => {
      if (e.target === editTeamModal) {
        closeEditTeamModal();
      }
    });
  }

  // Logo upload controls
  const uploadLogoBtn = document.getElementById('uploadLogoBtn');
  const logoFileInput = document.getElementById('logoFileInput');
  const removeLogoBtn = document.getElementById('removeLogoBtn');
  
  if (uploadLogoBtn && logoFileInput) {
    uploadLogoBtn.addEventListener('click', () => logoFileInput.click());
    logoFileInput.addEventListener('change', handleLogoUpload);
  }
  
  if (removeLogoBtn) {
    removeLogoBtn.addEventListener('click', removeLogoPreview);
  }

  // Edit team form submit
  const editTeamForm = document.getElementById('editTeamForm');
  if (editTeamForm) {
    editTeamForm.addEventListener('submit', handleEditTeamSubmit);
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

function showLoading() {
  console.log('Loading team data...');
  const loadingScreen = document.getElementById('loadingScreen');
  const teamDataContent = document.getElementById('teamDataContent');
  
  if (loadingScreen) loadingScreen.style.display = 'flex';
  if (teamDataContent) teamDataContent.style.display = 'none';
}

function hideLoading() {
  console.log('Loading complete');
  const loadingScreen = document.getElementById('loadingScreen');
  const teamDataContent = document.getElementById('teamDataContent');
  
  if (loadingScreen) loadingScreen.style.display = 'none';
  if (teamDataContent) teamDataContent.style.display = 'grid';
}

function showError(message) {
  alert(message);
}

// Store current team globally for editing
let currentTeam = null;

async function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file');
    return;
  }
  
  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('Image size must be less than 2MB');
    return;
  }
  
  try {
    // Show loading state
    const uploadLogoBtn = document.getElementById('uploadLogoBtn');
    if (uploadLogoBtn) {
      uploadLogoBtn.disabled = true;
      uploadLogoBtn.innerHTML = '<span>Uploading...</span>';
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentTeam.id}-${Date.now()}.${fileExt}`;
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('team-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('team-logos')
      .getPublicUrl(fileName);
    
    const publicUrl = urlData.publicUrl;
    
    // Update preview and hidden input
    const logoPreviewImg = document.getElementById('logoPreviewImg');
    const logoPlaceholder = document.getElementById('logoPlaceholder');
    const removeLogoBtn = document.getElementById('removeLogoBtn');
    const editTeamLogo = document.getElementById('editTeamLogo');
    
    if (logoPreviewImg && logoPlaceholder && editTeamLogo) {
      logoPreviewImg.src = publicUrl;
      logoPreviewImg.style.display = 'block';
      logoPlaceholder.style.display = 'none';
      editTeamLogo.value = publicUrl;
      
      if (removeLogoBtn) {
        removeLogoBtn.style.display = 'flex';
      }
    }
    
    console.log('Logo uploaded successfully:', publicUrl);
    
  } catch (error) {
    console.error('Error uploading logo:', error);
    alert('Failed to upload logo. Please try again.');
  } finally {
    // Reset button state
    const uploadLogoBtn = document.getElementById('uploadLogoBtn');
    if (uploadLogoBtn) {
      uploadLogoBtn.disabled = false;
      uploadLogoBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        Choose File
      `;
    }
  }
}

function removeLogoPreview() {
  const logoPreviewImg = document.getElementById('logoPreviewImg');
  const logoPlaceholder = document.getElementById('logoPlaceholder');
  const removeLogoBtn = document.getElementById('removeLogoBtn');
  const editTeamLogo = document.getElementById('editTeamLogo');
  const logoFileInput = document.getElementById('logoFileInput');
  
  if (logoPreviewImg) {
    logoPreviewImg.src = '';
    logoPreviewImg.style.display = 'none';
  }
  
  if (logoPlaceholder) {
    logoPlaceholder.style.display = 'flex';
  }
  
  if (removeLogoBtn) {
    removeLogoBtn.style.display = 'none';
  }
  
  if (editTeamLogo) {
    editTeamLogo.value = '';
  }
  
  if (logoFileInput) {
    logoFileInput.value = '';
  }
}

async function openEditTeamModal() {
  console.log('Opening edit team modal...');
  
  // Get current team data
  currentTeam = await teamsAPI.getCurrent();
  
  if (!currentTeam) {
    showError('No team found. Please create a team first.');
    return;
  }
  
  // Populate form with current team data
  document.getElementById('editTeamName').value = currentTeam.name || '';
  document.getElementById('editTeamAcronym').value = currentTeam.acronym || '';
  document.getElementById('editEstablishedYear').value = currentTeam.established_year || '';
  document.getElementById('editCountry').value = currentTeam.country || '';
  
  // Handle logo preview
  const logoPreviewImg = document.getElementById('logoPreviewImg');
  const logoPlaceholder = document.getElementById('logoPlaceholder');
  const removeLogoBtn = document.getElementById('removeLogoBtn');
  const editTeamLogo = document.getElementById('editTeamLogo');
  
  if (currentTeam.logo) {
    editTeamLogo.value = currentTeam.logo;
    logoPreviewImg.src = currentTeam.logo;
    logoPreviewImg.style.display = 'block';
    logoPlaceholder.style.display = 'none';
    removeLogoBtn.style.display = 'flex';
  } else {
    logoPreviewImg.style.display = 'none';
    logoPlaceholder.style.display = 'flex';
    removeLogoBtn.style.display = 'none';
    editTeamLogo.value = '';
  }
  
  // Show modal
  const modal = document.getElementById('editTeamModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeEditTeamModal() {
  const modal = document.getElementById('editTeamModal');
  if (modal) {
    modal.style.display = 'none';
  }
  
  // Reset form
  const form = document.getElementById('editTeamForm');
  if (form) {
    form.reset();
  }
  
  // Reset logo preview
  removeLogoPreview();
}

async function handleEditTeamSubmit(e) {
  e.preventDefault();
  
  if (!currentTeam) {
    showError('No team data available.');
    return;
  }
  
  // Get form data
  const formData = new FormData(e.target);
  const teamData = {
    name: formData.get('name'),
    acronym: formData.get('acronym'),
    logo: formData.get('logo') || null,
    established_year: formData.get('established_year') ? parseInt(formData.get('established_year')) : null,
    country: formData.get('country') || null
  };
  
  // Remove empty values
  Object.keys(teamData).forEach(key => {
    if (teamData[key] === '' || teamData[key] === null) {
      delete teamData[key];
    }
  });
  
  console.log('Updating team with data:', teamData);
  
  try {
    // Update team in database
    const updatedTeam = await teamsAPI.update(currentTeam.id, teamData);
    console.log('Team updated successfully:', updatedTeam);
    
    // Close modal
    closeEditTeamModal();
    
    // Reload team data to refresh the page
    await loadTeamData();
    
    // Show success message
    alert('Team profile updated successfully!');
  } catch (error) {
    console.error('Error updating team:', error);
    showError('Failed to update team profile. Please try again.');
  }
}
