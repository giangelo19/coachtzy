// Match History page functionality
import { requireAuth, getCurrentUser } from '../auth.js';
import { getAll, create, update, deleteMatch } from '../api/matches.js';

// Protect this page
await requireAuth();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get current user info
    const user = await getCurrentUser();
    updateUserProfile(user);

    // Load matches
    await loadMatches();
    
    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Match history page initialization error:', error);
  }
});

async function loadMatches() {
  try {
    showLoading();

    const matches = await getAll();
    displayMatches(matches);

    hideLoading();
  } catch (error) {
    console.error('Error loading matches:', error);
    showError('Failed to load match history. Please refresh the page.');
  }
}

function displayMatches(matches) {
  const matchesContainer = document.querySelector('.matches-list, .match-history-grid');
  if (!matchesContainer) return;

  if (!matches || matches.length === 0) {
    matchesContainer.innerHTML = '<p class="no-data">No matches recorded yet. Click "Add Match Result" to get started.</p>';
    return;
  }

  // Sort matches by date (most recent first)
  const sortedMatches = matches.sort((a, b) => new Date(b.date) - new Date(a.date));

  matchesContainer.innerHTML = sortedMatches.map(match => `
    <div class="match-card ${match.result}">
      <div class="match-header">
        <div class="match-result-badge ${match.result}">
          ${match.result === 'win' ? 'VICTORY' : 'DEFEAT'}
        </div>
        <div class="match-type">${formatMatchType(match.match_type)}</div>
      </div>
      <div class="match-body">
        <div class="match-info">
          <h3 class="opponent-name">vs ${match.opponent}</h3>
          <div class="match-date">${formatDate(match.date)}</div>
        </div>
        <div class="match-stats">
          <div class="stat-item">
            <span class="stat-label">Score</span>
            <span class="stat-value">${match.score || 'N/A'}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Avg KDA</span>
            <span class="stat-value">${match.average_kda ? match.average_kda.toFixed(2) : 'N/A'}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Duration</span>
            <span class="stat-value">${formatDuration(match.duration)}</span>
          </div>
        </div>
        ${match.notes ? `<div class="match-notes">${match.notes}</div>` : ''}
      </div>
      <div class="match-actions">
        <button class="btn-icon" onclick="viewMatchDetails('${match.id}')" title="View Details">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <button class="btn-icon" onclick="editMatch('${match.id}')" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="btn-icon btn-delete" onclick="confirmDeleteMatch('${match.id}', '${match.opponent}')" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

function formatMatchType(type) {
  const typeMap = {
    'scrim': 'Scrim',
    'tournament': 'Tournament'
  };
  return typeMap[type] || type || 'Match';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'long', 
    day: 'numeric' 
  });
}

function formatDuration(minutes) {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// Make functions globally available for onclick handlers
window.viewMatchDetails = function(matchId) {
  console.log('View match details:', matchId);
  // TODO: Open match details modal
  alert('View match details functionality coming soon!');
};

window.editMatch = function(matchId) {
  console.log('Edit match:', matchId);
  // TODO: Open edit modal
  alert('Edit match functionality coming soon!');
};

window.confirmDeleteMatch = async function(matchId, opponent) {
  if (confirm(`Are you sure you want to delete the match vs ${opponent}?`)) {
    try {
      await deleteMatch(matchId);
      alert('Match deleted successfully!');
      await loadMatches();
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Failed to delete match. Please try again.');
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

  // Add Match Result button
  const addMatchBtn = document.querySelector('.btn-primary');
  if (addMatchBtn) {
    addMatchBtn.addEventListener('click', () => {
      // TODO: Open add match modal
      alert('Add match result functionality coming soon!');
    });
  }

  // Filter buttons (if they exist)
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      filterMatches(filter);
    });
  });

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

function filterMatches(filter) {
  // TODO: Implement filtering logic
  console.log('Filter matches:', filter);
}

function showLoading() {
  console.log('Loading matches...');
}

function hideLoading() {
  console.log('Loading complete');
}

function showError(message) {
  alert(message);
}
