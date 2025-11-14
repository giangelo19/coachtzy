// Draft Simulator functionality
console.log('🎮 Draft Simulator loading...');

import { requireAuth, getCurrentUser } from '../auth.js';
import { supabase } from '../supabase-client.js';

// Draft sequence following MLBB format
const DRAFT_SEQUENCE = [
  { team: 'red', action: 'ban', index: 0, text: 'Red Team - Ban 1' },
  { team: 'blue', action: 'ban', index: 0, text: 'Blue Team - Ban 1' },
  { team: 'red', action: 'ban', index: 1, text: 'Red Team - Ban 2' },
  { team: 'blue', action: 'ban', index: 1, text: 'Blue Team - Ban 2' },
  { team: 'red', action: 'ban', index: 2, text: 'Red Team - Ban 3' },
  { team: 'blue', action: 'ban', index: 2, text: 'Blue Team - Ban 3' },
  { team: 'red', action: 'pick', index: 0, text: 'Red Team - Pick 1' },
  { team: 'blue', action: 'pick', index: 0, text: 'Blue Team - Pick 1' },
  { team: 'blue', action: 'pick', index: 1, text: 'Blue Team - Pick 2' },
  { team: 'red', action: 'pick', index: 1, text: 'Red Team - Pick 2' },
  { team: 'red', action: 'pick', index: 2, text: 'Red Team - Pick 3' },
  { team: 'blue', action: 'pick', index: 2, text: 'Blue Team - Pick 3' },
  { team: 'blue', action: 'ban', index: 3, text: 'Blue Team - Ban 4' },
  { team: 'red', action: 'ban', index: 3, text: 'Red Team - Ban 4' },
  { team: 'blue', action: 'ban', index: 4, text: 'Blue Team - Ban 5' },
  { team: 'red', action: 'ban', index: 4, text: 'Red Team - Ban 5' },
  { team: 'blue', action: 'pick', index: 3, text: 'Blue Team - Pick 4' },
  { team: 'red', action: 'pick', index: 3, text: 'Red Team - Pick 4' },
  { team: 'red', action: 'pick', index: 4, text: 'Red Team - Pick 5' },
  { team: 'blue', action: 'pick', index: 4, text: 'Blue Team - Pick 5' }
];

// State management
let currentStep = 0;
let allHeroes = [];
let draftHistory = [];
let selectedHeroes = new Set();

// Modal helper functions
function showModal(title, message, type = 'info') {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirm');
    const cancelBtn = document.getElementById('modalCancel');
    
    // Set icon based on type
    modalIcon.className = `modal-icon ${type}`;
    if (type === 'danger') {
      modalIcon.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    } else if (type === 'warning') {
      modalIcon.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      `;
    } else {
      modalIcon.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
      `;
    }
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = 'flex';
    
    // Update confirm button style based on type
    confirmBtn.className = type === 'danger' ? 'btn-modal btn-danger' : 'btn-modal btn-primary';
    
    const handleConfirm = () => {
      modal.style.display = 'none';
      cleanup();
      resolve(true);
    };
    
    const handleCancel = () => {
      modal.style.display = 'none';
      cleanup();
      resolve(false);
    };
    
    const cleanup = () => {
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 Draft Simulator DOM loaded');
  
  try {
    // Protect this page
    await requireAuth();
    
    // Get current user info
    const user = await getCurrentUser();
    updateUserProfile(user);
    
    // Load heroes from database
    await loadHeroes();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize draft
    updateDraftStatus();
    
    console.log('✅ Draft Simulator initialized');
  } catch (error) {
    console.error('❌ Draft Simulator initialization error:', error);
  }
});

async function loadHeroes() {
  try {
    console.log('🔄 Loading heroes from database...');
    
    const { data, error } = await supabase
      .from('heroes')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }
    
    allHeroes = data || [];
    
    console.log(`✅ Loaded ${allHeroes.length} heroes`, allHeroes.slice(0, 3));
    console.log('📊 Sample hero roles:', allHeroes.slice(0, 5).map(h => ({ name: h.name, role1: h.role1, role2: h.role2 })));
    renderHeroes(allHeroes);
  } catch (error) {
    console.error('❌ Error loading heroes:', error);
    alert('Failed to load heroes. Please refresh the page.');
  }
}

function renderHeroes(heroes) {
  console.log('🎨 Rendering heroes...', heroes.length);
  const container = document.getElementById('heroGridContainer');
  if (!container) {
    console.error('❌ Hero grid container not found!');
    return;
  }
  
  container.innerHTML = '';
  
  if (heroes.length === 0) {
    console.warn('⚠️ No heroes to render');
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">No heroes found</p>';
    return;
  }
  
  heroes.forEach(hero => {
    const isDisabled = selectedHeroes.has(hero.id);
    const heroCard = document.createElement('div');
    heroCard.className = `hero-card ${isDisabled ? 'disabled' : ''}`;
    heroCard.dataset.heroId = hero.id;
    heroCard.dataset.heroName = hero.name;
    
    const role1Badge = hero.role1 ? `
      <span class="role-badge role-${hero.role1.toLowerCase()}">
        ${hero.role1}
      </span>
    ` : '';
    
    const role2Badge = hero.role2 ? `
      <span class="role-badge role-${hero.role2.toLowerCase()}">
        ${hero.role2}
      </span>
    ` : '';
    
    heroCard.innerHTML = `
      <img src="${hero.icon || '/assets/placeholder.jpg'}" alt="${hero.name}" class="hero-image" onerror="this.src='/assets/placeholder.jpg'" />
      <div class="hero-info">
        <div class="hero-name">${hero.name}</div>
        <div class="hero-roles">
          ${role1Badge}
          ${role2Badge}
        </div>
      </div>
      ${isDisabled ? '<div class="hero-disabled-overlay">✕</div>' : ''}
    `;
    
    if (!isDisabled) {
      heroCard.addEventListener('click', () => handleHeroClick(hero));
    }
    
    container.appendChild(heroCard);
  });
}

async function handleHeroClick(hero) {
  if (currentStep >= DRAFT_SEQUENCE.length) {
    await showModal('Draft Complete', 'The draft has already been completed!', 'info');
    return;
  }
  
  if (selectedHeroes.has(hero.id)) {
    await showModal('Hero Unavailable', 'This hero has already been picked or banned!', 'warning');
    return;
  }
  
  const currentPhase = DRAFT_SEQUENCE[currentStep];
  const action = currentPhase.action === 'ban' ? 'BAN' : 'PICK';
  const team = currentPhase.team === 'red' ? 'Red' : 'Blue';
  
  // Show confirmation prompt
  const confirmed = await showModal(
    `${action} ${hero.name}?`,
    `Are you sure you want to ${action.toLowerCase()} ${hero.name} for ${team} Team?`,
    'info'
  );
  
  if (confirmed) {
    selectHero(hero, currentPhase);
  }
}

function selectHero(hero, phase) {
  console.log(`✅ ${phase.team} ${phase.action} ${phase.index + 1}: ${hero.name}`);
  
  // Add to selected heroes
  selectedHeroes.add(hero.id);
  
  // Add to history
  draftHistory.push({
    step: currentStep,
    team: phase.team,
    action: phase.action,
    index: phase.index,
    hero
  });
  
  // Update the UI slot
  updateSlot(phase.team, phase.action, phase.index, hero);
  
  // Move to next step
  currentStep++;
  
  // Update status
  updateDraftStatus();
  
  // Update counts
  updateCounters();
  
  // Re-render heroes to show disabled state
  const searchInput = document.getElementById('heroSearchInput');
  const currentRole = document.querySelector('.role-filter-btn.active')?.dataset.role;
  
  let heroesToRender = allHeroes;
  
  if (searchInput && searchInput.value) {
    const term = searchInput.value.toLowerCase();
    heroesToRender = heroesToRender.filter(h => h.name.toLowerCase().includes(term));
  }
  
  if (currentRole && currentRole !== 'all') {
    heroesToRender = heroesToRender.filter(h => h.role === currentRole);
  }
  
  renderHeroes(heroesToRender);
  
  // Enable undo button
  document.getElementById('undoBtn').disabled = false;
  
  // Check if draft is complete
  if (currentStep >= DRAFT_SEQUENCE.length) {
    document.getElementById('currentPhaseText').textContent = 'Draft Complete!';
    document.getElementById('currentPhaseText').style.color = 'var(--success)';
  }
}

function updateSlot(team, action, index, hero) {
  const containerId = action === 'ban' ? `${team}Bans` : `${team}Picks`;
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const slot = container.querySelector(`[data-index="${index}"]`);
  if (!slot) return;
  
  slot.classList.remove('empty');
  slot.classList.add('filled');
  
  if (action === 'ban') {
    slot.innerHTML = `
      <img src="${hero.icon || '/assets/placeholder.jpg'}" alt="${hero.name}" />
      <div class="ban-overlay">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
    `;
  } else {
    const slotNumber = slot.querySelector('.slot-number');
    const slotNumberHTML = slotNumber ? slotNumber.outerHTML : '';
    slot.innerHTML = `
      <img src="${hero.icon || '/assets/placeholder.jpg'}" alt="${hero.name}" />
      ${slotNumberHTML}
    `;
  }
}

function updateCounters() {
  // Count bans and picks for each team
  const redBans = draftHistory.filter(h => h.team === 'red' && h.action === 'ban').length;
  const blueBans = draftHistory.filter(h => h.team === 'blue' && h.action === 'ban').length;
  const redPicks = draftHistory.filter(h => h.team === 'red' && h.action === 'pick').length;
  const bluePicks = draftHistory.filter(h => h.team === 'blue' && h.action === 'pick').length;
  
  document.getElementById('redBansCount').textContent = `${redBans}/5`;
  document.getElementById('blueBansCount').textContent = `${blueBans}/5`;
  document.getElementById('redPicksCount').textContent = `${redPicks}/5`;
  document.getElementById('bluePicksCount').textContent = `${bluePicks}/5`;
}

function updateDraftStatus() {
  const statusText = document.getElementById('currentPhaseText');
  if (!statusText) return;
  
  if (currentStep >= DRAFT_SEQUENCE.length) {
    statusText.textContent = 'Draft Complete!';
    statusText.style.color = 'var(--success)';
    return;
  }
  
  const currentTurn = DRAFT_SEQUENCE[currentStep];
  statusText.textContent = currentTurn.text;
  statusText.style.color = currentTurn.team === 'red' ? 'var(--error)' : 'var(--accent-blue)';
}

function undoLastAction() {
  if (draftHistory.length === 0) return;
  
  // Get last action
  const lastAction = draftHistory.pop();
  
  // Remove from selected heroes
  selectedHeroes.delete(lastAction.hero.id);
  
  // Clear the slot
  const containerId = lastAction.action === 'ban' ? `${lastAction.team}Bans` : `${lastAction.team}Picks`;
  const container = document.getElementById(containerId);
  if (container) {
    const slot = container.querySelector(`[data-index="${lastAction.index}"]`);
    if (slot) {
      slot.classList.remove('filled');
      slot.classList.add('empty');
      
      if (lastAction.action === 'pick') {
        const slotNumber = lastAction.index + 1;
        slot.innerHTML = `<div class="slot-number">${slotNumber}</div>`;
      } else {
        slot.innerHTML = '';
      }
    }
  }
  
  // Go back one step
  currentStep--;
  
  // Update status
  updateDraftStatus();
  updateCounters();
  
  // Re-render heroes with current filters
  const searchInput = document.getElementById('heroSearchInput');
  const currentRole = document.querySelector('.role-filter-btn.active')?.dataset.role;
  
  let heroesToRender = allHeroes;
  
  if (searchInput && searchInput.value) {
    const term = searchInput.value.toLowerCase();
    heroesToRender = heroesToRender.filter(h => h.name.toLowerCase().includes(term));
  }
  
  if (currentRole && currentRole !== 'all') {
    heroesToRender = heroesToRender.filter(h => h.role === currentRole);
  }
  
  renderHeroes(heroesToRender);
  
  // Disable undo if no more history
  if (draftHistory.length === 0) {
    document.getElementById('undoBtn').disabled = true;
  }
}

async function resetDraft() {
  if (draftHistory.length > 0) {
    const confirmed = await showModal(
      'Reset Draft?',
      'Are you sure you want to reset the draft? All selections will be lost.',
      'danger'
    );
    
    if (!confirmed) {
      return;
    }
  }
  
  // Reset state
  currentStep = 0;
  draftHistory = [];
  selectedHeroes.clear();
  
  // Clear all slots
  ['red', 'blue'].forEach(team => {
    ['Bans', 'Picks'].forEach(action => {
      const container = document.getElementById(`${team}${action}`);
      if (container) {
        const slots = container.querySelectorAll('.draft-slot');
        slots.forEach((slot, index) => {
          slot.classList.remove('filled');
          slot.classList.add('empty');
          
          if (action === 'Picks') {
            slot.innerHTML = `<div class="slot-number">${index + 1}</div>`;
          } else {
            slot.innerHTML = '';
          }
        });
      }
    });
  });
  
  // Update UI
  updateDraftStatus();
  updateCounters();
  renderHeroes();
  
  document.getElementById('undoBtn').disabled = true;
}

function setupEventListeners() {
  // Undo button
  const undoBtn = document.getElementById('undoBtn');
  if (undoBtn) {
    undoBtn.addEventListener('click', undoLastAction);
  }
  
  // Reset button
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetDraft);
  }
  
  // Search input
  const searchInput = document.getElementById('heroSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterHeroes(e.target.value);
    });
  }
  
  // Role filter buttons
  const roleButtons = document.querySelectorAll('.role-filter-btn');
  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      roleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Filter by role
      const role = btn.dataset.role;
      filterByRole(role);
    });
  });
}

function filterHeroes(searchTerm) {
  const term = searchTerm.toLowerCase();
  
  // Get current role filter
  const currentRole = document.querySelector('.role-filter-btn.active')?.dataset.role;
  
  let filtered = allHeroes;
  
  // Apply role filter first (case-insensitive)
  if (currentRole && currentRole !== 'all') {
    const roleLower = currentRole.toLowerCase();
    filtered = filtered.filter(hero => {
      const role1Match = hero.role1?.toLowerCase() === roleLower;
      const role2Match = hero.role2?.toLowerCase() === roleLower;
      return role1Match || role2Match;
    });
  }
  
  // Apply search filter
  if (term) {
    filtered = filtered.filter(hero => hero.name.toLowerCase().includes(term));
  }
  
  renderHeroes(filtered);
}

function filterByRole(role) {
  console.log('🔍 Filtering by role:', role);
  let filtered = allHeroes;
  
  // Apply role filter (case-insensitive)
  if (role !== 'all') {
    const roleLower = role.toLowerCase();
    filtered = filtered.filter(hero => {
      const role1Match = hero.role1?.toLowerCase() === roleLower;
      const role2Match = hero.role2?.toLowerCase() === roleLower;
      return role1Match || role2Match;
    });
    console.log(`📋 Found ${filtered.length} heroes with role ${role}`);
  }
  
  // Apply current search if any
  const searchInput = document.getElementById('heroSearchInput');
  if (searchInput && searchInput.value) {
    const term = searchInput.value.toLowerCase();
    filtered = filtered.filter(hero => hero.name.toLowerCase().includes(term));
  }
  
  renderHeroes(filtered);
}

function updateUserProfile(user) {
  if (!user) return;
  
  const displayNameElements = document.querySelectorAll('#userDisplayName, #dropdownDisplayName');
  const emailElements = document.querySelectorAll('#dropdownEmail');
  
  if (user?.user_metadata?.display_name) {
    displayNameElements.forEach(el => el.textContent = user.user_metadata.display_name);
  }
  
  if (user?.email) {
    emailElements.forEach(el => el.textContent = user.email);
  }
}
