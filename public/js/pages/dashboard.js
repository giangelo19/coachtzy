// Dashboard page functionality
import { requireAuth, getCurrentUser } from '../auth.js';
import { getDashboardData } from '../api/dashboard.js';
import { getRecent as getRecentMatches } from '../api/matches.js';

// Protect this page - redirect to login if not authenticated
await requireAuth();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get current user info
    const user = await getCurrentUser();
    updateUserProfile(user);

    // Load dashboard data
    await loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Dashboard initialization error:', error);
  }
});

async function loadDashboardData() {
  try {
    // Show loading state
    showLoading();

    // Fetch dashboard data
    const dashboardData = await getDashboardData();
    const recentMatches = await getRecentMatches(5);

    // Update UI with data
    updateTeamStats(dashboardData.teamStats);
    updatePlayerCards(dashboardData.topPlayers);
    updateRecentMatches(recentMatches);
    updateWeeklyPerformance(dashboardData.weeklyPerformance);

    hideLoading();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showError('Failed to load dashboard data. Please refresh the page.');
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

function updateTeamStats(stats) {
  if (!stats) return;

  const totalWinsEl = document.querySelector('.stat-card:nth-child(1) .stat-number');
  const totalLossesEl = document.querySelector('.stat-card:nth-child(2) .stat-number');
  const avgKdaEl = document.querySelector('.stat-card:nth-child(3) .stat-number');
  const winrateEl = document.querySelector('.stat-card:nth-child(4) .stat-number');

  if (totalWinsEl) totalWinsEl.textContent = stats.total_wins || 0;
  if (totalLossesEl) totalLossesEl.textContent = stats.total_losses || 0;
  if (avgKdaEl) avgKdaEl.textContent = (stats.average_kda || 0).toFixed(2);
  if (winrateEl) winrateEl.textContent = `${(stats.winrate || 0).toFixed(1)}%`;
}

function updatePlayerCards(players) {
  const playerCardsContainer = document.querySelector('.player-cards');
  if (!playerCardsContainer || !players || players.length === 0) return;

  playerCardsContainer.innerHTML = players.map(player => `
    <div class="player-card">
      <img src="${player.profile_picture || '../assets/default_pfp.png'}" alt="${player.name}" class="player-avatar" />
      <div class="player-info">
        <h3 class="player-name">${player.name}</h3>
        <span class="player-role">${formatRole(player.role)}</span>
      </div>
      <div class="player-stats">
        <div class="stat">
          <span class="stat-label">KDA</span>
          <span class="stat-value">${(player.average_kda || 0).toFixed(2)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Winrate</span>
          <span class="stat-value">${(player.winrate || 0).toFixed(1)}%</span>
        </div>
        <div class="stat">
          <span class="stat-label">Matches</span>
          <span class="stat-value">${player.total_matches || 0}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function updateRecentMatches(matches) {
  const matchesContainer = document.querySelector('.recent-matches-list');
  if (!matchesContainer || !matches || matches.length === 0) return;

  matchesContainer.innerHTML = matches.map(match => `
    <div class="match-item ${match.result}">
      <div class="match-info">
        <span class="match-opponent">${match.opponent}</span>
        <span class="match-date">${formatDate(match.date)}</span>
      </div>
      <div class="match-result">
        <span class="result-badge ${match.result}">${match.result === 'win' ? 'W' : 'L'}</span>
        <span class="match-score">${match.score || 'N/A'}</span>
      </div>
    </div>
  `).join('');
}

function updateWeeklyPerformance(weeklyData) {
  // This would integrate with a charting library like Chart.js
  // For now, we'll just log the data
  console.log('Weekly performance data:', weeklyData);
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

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  // Add loading indicators to the page
  console.log('Loading...');
}

function hideLoading() {
  console.log('Loading complete');
}

function showError(message) {
  alert(message);
}
