// Draft Simulator page functionality
import { requireAuth, getCurrentUser } from '../auth.js';
import { create as createDraft, addPick, getAllHeroes } from '../api/drafts.js';
import { getByRole, search as searchHeroes } from '../api/heroes.js';

// Protect this page
await requireAuth();

let currentDraft = null;
let allHeroes = [];
let filteredHeroes = [];
let currentTeam = 'blue'; // 'blue' or 'red'
let currentPhase = 'ban'; // 'ban' or 'pick'

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get current user info
    const user = await getCurrentUser();
    updateUserProfile(user);

    // Load heroes
    await loadHeroes();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize a new draft
    await initializeDraft();
  } catch (error) {
    console.error('Draft simulator page initialization error:', error);
  }
});

async function loadHeroes() {
  try {
    allHeroes = await getAllHeroes();
    filteredHeroes = [...allHeroes];
    displayHeroes(filteredHeroes);
  } catch (error) {
    console.error('Error loading heroes:', error);
    showError('Failed to load heroes. Please refresh the page.');
  }
}

async function initializeDraft() {
  try {
    // Create a new draft session
    currentDraft = await createDraft({
      draft_name: `Draft ${new Date().toISOString()}`,
      red_team_name: 'Red Team',
      blue_team_name: 'Blue Team'
    });
    
    console.log('Draft initialized:', currentDraft);
  } catch (error) {
    console.error('Error initializing draft:', error);
  }
}

function displayHeroes(heroes) {
  const heroesGrid = document.querySelector('.heroes-grid, .hero-list');
  if (!heroesGrid) return;

  if (!heroes || heroes.length === 0) {
    heroesGrid.innerHTML = '<p class="no-data">No heroes found.</p>';
    return;
  }

  heroesGrid.innerHTML = heroes.map(hero => `
    <div class="hero-card" data-hero-id="${hero.id}" onclick="selectHero('${hero.id}', '${hero.name}')">
      <img src="${hero.icon || '../assets/placeholder.jpg'}" alt="${hero.name}" class="hero-icon" />
      <div class="hero-name">${hero.name}</div>
      <div class="hero-role">${hero.role || ''}</div>
    </div>
  `).join('');
}

window.selectHero = async function(heroId, heroName) {
  if (!currentDraft) {
    alert('Please initialize a draft first');
    return;
  }

  try {
    // Add pick to the draft
    await addPick(currentDraft.id, {
      hero_id: heroId,
      team: currentTeam,
      pick_type: currentPhase
    });

    // Update UI
    updateDraftBoard(heroId, heroName, currentTeam, currentPhase);
    
    // Remove hero from available list
    const heroCard = document.querySelector(`[data-hero-id="${heroId}"]`);
    if (heroCard) {
      heroCard.classList.add('disabled');
      heroCard.style.opacity = '0.3';
      heroCard.style.pointerEvents = 'none';
    }

    // Switch turn (simplified logic)
    switchTurn();
  } catch (error) {
    console.error('Error selecting hero:', error);
    alert('Failed to select hero. Please try again.');
  }
};

function updateDraftBoard(heroId, heroName, team, phase) {
  // Find the next available slot for this team and phase
  const slotSelector = `.${team}-team .${phase}-slots .draft-slot:not(.filled)`;
  const slot = document.querySelector(slotSelector);
  
  if (slot) {
    slot.classList.add('filled');
    slot.innerHTML = `
      <img src="../assets/placeholder.jpg" alt="${heroName}" class="hero-icon" />
      <span class="hero-name">${heroName}</span>
    `;
  }
}

function switchTurn() {
  // Simple turn switching logic (this should be more sophisticated in production)
  if (currentTeam === 'blue') {
    currentTeam = 'red';
  } else {
    currentTeam = 'blue';
  }
  
  updateTurnIndicator();
}

function updateTurnIndicator() {
  const indicator = document.querySelector('.turn-indicator');
  if (indicator) {
    indicator.textContent = `${currentTeam.toUpperCase()} Team's Turn - ${currentPhase.toUpperCase()}`;
    indicator.className = `turn-indicator ${currentTeam}`;
  }
}

async function filterHeroesByRole(role) {
  if (role === 'all') {
    filteredHeroes = [...allHeroes];
  } else {
    filteredHeroes = await getByRole(role);
  }
  displayHeroes(filteredHeroes);
}

async function searchForHero(searchTerm) {
  if (!searchTerm) {
    filteredHeroes = [...allHeroes];
  } else {
    filteredHeroes = await searchHeroes(searchTerm);
  }
  displayHeroes(filteredHeroes);
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

  // Hero search
  const searchInput = document.querySelector('.hero-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchForHero(e.target.value);
    });
  }

  // Role filter buttons
  const roleButtons = document.querySelectorAll('.role-filter-btn');
  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      roleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const role = btn.dataset.role;
      filterHeroesByRole(role);
    });
  });

  // Reset draft button
  const resetBtn = document.querySelector('.reset-draft-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset the draft?')) {
        await initializeDraft();
        location.reload();
      }
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

function showError(message) {
  alert(message);
}
