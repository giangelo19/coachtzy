// Team page functionality
import { requireAuth, getCurrentUser } from '../auth.js';
import { getCurrent, getStats, getRoster } from '../api/teams.js';

// Protect this page
await requireAuth();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get current user info
    const user = await getCurrentUser();
    updateUserProfile(user);

    // Load team data
    await loadTeamData();
    
    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Team page initialization error:', error);
  }
});

async function loadTeamData() {
  try {
    showLoading();

    const team = await getCurrent();
    const stats = await getStats();
    const roster = await getRoster();

    if (team) {
      updateTeamProfile(team);
      updateTeamStats(stats);
      updateRoster(roster);
    } else {
      showNoTeamMessage();
    }

    hideLoading();
  } catch (error) {
    console.error('Error loading team data:', error);
    showError('Failed to load team data. Please refresh the page.');
  }
}

function updateTeamProfile(team) {
  const teamNameEl = document.querySelector('.team-name');
  const teamAcronymEl = document.querySelector('.team-acronym');
  const teamLogoEl = document.querySelector('.team-logo');
  const establishedYearEl = document.querySelector('.established-year');
  const countryEl = document.querySelector('.country');

  if (teamNameEl) teamNameEl.textContent = team.name || 'Team Name';
  if (teamAcronymEl) teamAcronymEl.textContent = team.acronym || 'TM';
  if (teamLogoEl && team.logo) teamLogoEl.src = team.logo;
  if (establishedYearEl) establishedYearEl.textContent = `Est. ${team.established_year || 'N/A'}`;
  if (countryEl) countryEl.textContent = team.country || 'Country';
}

function updateTeamStats(stats) {
  if (!stats) return;

  const totalWinsEl = document.querySelector('.team-stat-card:nth-child(1) .stat-number');
  const totalLossesEl = document.querySelector('.team-stat-card:nth-child(2) .stat-number');
  const avgKdaEl = document.querySelector('.team-stat-card:nth-child(3) .stat-number');
  const winrateEl = document.querySelector('.team-stat-card:nth-child(4) .stat-number');

  if (totalWinsEl) totalWinsEl.textContent = stats.total_wins || 0;
  if (totalLossesEl) totalLossesEl.textContent = stats.total_losses || 0;
  if (avgKdaEl) avgKdaEl.textContent = (stats.average_kda || 0).toFixed(2);
  if (winrateEl) winrateEl.textContent = `${(stats.winrate || 0).toFixed(1)}%`;
}

function updateRoster(roster) {
  const rosterContainer = document.querySelector('.roster-list, .roster-grid');
  if (!rosterContainer) return;

  if (!roster || roster.length === 0) {
    rosterContainer.innerHTML = '<p class="no-data">No players in roster. Add players to get started.</p>';
    return;
  }

  rosterContainer.innerHTML = roster.map(player => `
    <div class="roster-player">
      <img src="${player.profile_picture || '../assets/default_pfp.png'}" alt="${player.name}" class="player-avatar" />
      <div class="player-info">
        <h4 class="player-name">${player.name}</h4>
        <div class="player-role">
          <img src="../assets/${getRoleIcon(player.role)}" alt="${player.role}" class="role-icon-small" />
          <span>${formatRole(player.role)}</span>
        </div>
      </div>
      <div class="player-stats-inline">
        <div class="stat-item">
          <span class="stat-label">KDA</span>
          <span class="stat-value">${(player.average_kda || 0).toFixed(2)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">WR</span>
          <span class="stat-value">${(player.winrate || 0).toFixed(1)}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Matches</span>
          <span class="stat-value">${player.total_matches || 0}</span>
        </div>
      </div>
    </div>
  `).join('');
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
}

function hideLoading() {
  console.log('Loading complete');
}

function showError(message) {
  alert(message);
}
