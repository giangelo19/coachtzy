// Players page functionality
import { requireAuth, getCurrentUser } from '../auth.js';
import { getAll, create, update, deletePlayer } from '../api/players.js';

// Protect this page
await requireAuth();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get current user info
    const user = await getCurrentUser();
    updateUserProfile(user);

    // Load players
    await loadPlayers();
    
    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Players page initialization error:', error);
  }
});

async function loadPlayers() {
  try {
    showLoading();

    const players = await getAll();
    displayPlayers(players);

    hideLoading();
  } catch (error) {
    console.error('Error loading players:', error);
    showError('Failed to load players. Please refresh the page.');
  }
}

function displayPlayers(players) {
  const playersGrid = document.querySelector('.players-grid');
  if (!playersGrid) return;

  if (!players || players.length === 0) {
    playersGrid.innerHTML = '<p class="no-data">No players found. Click "Add Player" to get started.</p>';
    return;
  }

  playersGrid.innerHTML = players.map(player => `
    <div class="player-card" data-player-id="${player.id}">
      <div class="player-card-header">
        <img src="${player.profile_picture || '../assets/default_pfp.png'}" alt="${player.name}" class="player-avatar" />
        <div class="player-status ${player.status || 'active'}">
          ${player.status === 'active' ? 'Active' : 'Inactive'}
        </div>
      </div>
      <div class="player-card-body">
        <h3 class="player-name">${player.name}</h3>
        <div class="player-role">
          <img src="../assets/${getRoleIcon(player.role)}" alt="${player.role}" class="role-icon" />
          <span>${formatRole(player.role)}</span>
        </div>
        <div class="player-stats-grid">
          <div class="stat-item">
            <span class="stat-label">Matches</span>
            <span class="stat-value">${player.total_matches || 0}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Wins</span>
            <span class="stat-value">${player.total_wins || 0}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">KDA</span>
            <span class="stat-value">${(player.average_kda || 0).toFixed(2)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Winrate</span>
            <span class="stat-value">${(player.winrate || 0).toFixed(1)}%</span>
          </div>
        </div>
        <div class="player-card-actions">
          <button class="btn-edit" onclick="editPlayer('${player.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </button>
          <button class="btn-delete" onclick="confirmDeletePlayer('${player.id}', '${player.name}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete
          </button>
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

// Make functions globally available for onclick handlers
window.editPlayer = function(playerId) {
  console.log('Edit player:', playerId);
  // TODO: Open edit modal or navigate to edit page
  alert('Edit player functionality coming soon!');
};

window.confirmDeletePlayer = async function(playerId, playerName) {
  if (confirm(`Are you sure you want to delete ${playerName}?`)) {
    try {
      await deletePlayer(playerId);
      alert('Player deleted successfully!');
      await loadPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Failed to delete player. Please try again.');
    }
  }
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

  // Add Player button
  const addPlayerBtn = document.querySelector('.btn-primary');
  if (addPlayerBtn) {
    addPlayerBtn.addEventListener('click', () => {
      // TODO: Open add player modal
      alert('Add player functionality coming soon!');
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
  console.log('Loading players...');
}

function hideLoading() {
  console.log('Loading complete');
}

function showError(message) {
  alert(message);
}
