// Match History page functionality
import { requireAuth } from '../auth.js';
import { matchesAPI } from '../api/matches.js';

// State
let matches = [];
let currentEditingMatchId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Protect this page
    await requireAuth();
    
    // Load matches from database
    await loadMatches();
    
    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Match history page initialization error:', error);
  }
});

// Load matches from database
async function loadMatches() {
  try {
    showLoading();
    matches = await matchesAPI.getAll();
    displayMatches(matches);
    hideLoading();
  } catch (error) {
    console.error('Error loading matches:', error);
    showError('Failed to load match history. Please refresh the page.');
    hideLoading();
  }
}

// Display matches in table
function displayMatches(matchesData) {
  const tbody = document.getElementById('matchTableBody');
  if (!tbody) return;

  if (!matchesData || matchesData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #95a5a6;">
          No matches recorded yet. Click "Add Match Result" to get started.
        </td>
      </tr>
    `;
    return;
  }

  // Sort by date (most recent first)
  const sortedMatches = [...matchesData].sort((a, b) => 
    new Date(b.match_date) - new Date(a.match_date)
  );

  tbody.innerHTML = sortedMatches.map(match => createMatchRow(match)).join('');
}

// Create match row HTML
function createMatchRow(match) {
  const date = formatDate(match.match_date);
  const resultClass = match.result === 'win' ? 'win' : 'lose';
  const resultText = match.result === 'win' ? 'WIN' : 'LOSE';
  const matchType = match.match_type.charAt(0).toUpperCase() + match.match_type.slice(1);
  const score = `${match.score_team}-${match.score_opponent}`;
  const kda = match.average_kda ? parseFloat(match.average_kda).toFixed(1) : '0.0';

  return `
    <tr>
      <td class="date-cell">${date}</td>
      <td class="opponent-cell">
        <a href="#" class="opponent-link">${match.opponent_name}</a>
      </td>
      <td class="status-cell">
        <span class="match-status ${resultClass}">${resultText}</span>
      </td>
      <td class="result-cell">${score}</td>
      <td class="type-cell">${matchType}</td>
      <td class="kda-cell">${kda}</td>
      <td class="notes-cell">
        ${match.notes ? `
          <button class="btn-notes" onclick="window.showMatchNotes('${match.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Notes
          </button>
        ` : '<span style="color: #95a5a6;">—</span>'}
      </td>
      <td class="actions-cell">
        <button class="btn-icon btn-edit" onclick="window.openEditMatchModal('${match.id}')" title="Edit Match">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="btn-icon btn-delete" onclick="window.handleDeleteMatch('${match.id}', '${match.opponent_name}')" title="Delete Match">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    </tr>
  `;
}

// Format date (e.g., "Oct 08")
function formatDate(dateString) {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, '0');
  return `${month} ${day}`;
}

// Setup event listeners
function setupEventListeners() {
  // Add Match button
  const addMatchBtn = document.getElementById('addMatchBtn');
  console.log('Add Match button found:', addMatchBtn);
  if (addMatchBtn) {
    addMatchBtn.addEventListener('click', openAddMatchModal);
    console.log('Click listener added to Add Match button');
  } else {
    console.error('Add Match button not found!');
  }

  // Add Match Modal
  const addMatchModal = document.getElementById('addMatchModal');
  const closeAddMatchModal = document.getElementById('closeAddMatchModal');
  const cancelAddMatch = document.getElementById('cancelAddMatch');
  const addMatchForm = document.getElementById('addMatchForm');

  if (closeAddMatchModal) {
    closeAddMatchModal.addEventListener('click', () => {
      addMatchModal.classList.remove('show');
    });
  }

  if (cancelAddMatch) {
    cancelAddMatch.addEventListener('click', () => {
      addMatchModal.classList.remove('show');
    });
  }

  if (addMatchForm) {
    addMatchForm.addEventListener('submit', handleAddMatch);
  }

  // Edit Match Modal
  const editMatchModal = document.getElementById('editMatchModal');
  const closeEditMatchModal = document.getElementById('closeEditMatchModal');
  const cancelEditMatch = document.getElementById('cancelEditMatch');
  const editMatchForm = document.getElementById('editMatchForm');

  if (closeEditMatchModal) {
    closeEditMatchModal.addEventListener('click', () => {
      editMatchModal.classList.remove('show');
    });
  }

  if (cancelEditMatch) {
    cancelEditMatch.addEventListener('click', () => {
      editMatchModal.classList.remove('show');
    });
  }

  if (editMatchForm) {
    editMatchForm.addEventListener('submit', handleEditMatch);
  }

  // Close modals on outside click
  window.addEventListener('click', (e) => {
    if (e.target === addMatchModal) {
      addMatchModal.classList.remove('show');
    }
    if (e.target === editMatchModal) {
      editMatchModal.classList.remove('show');
    }
  });
}

// Open Add Match Modal
function openAddMatchModal() {
  console.log('openAddMatchModal called');
  const modal = document.getElementById('addMatchModal');
  const form = document.getElementById('addMatchForm');
  
  console.log('Modal element:', modal);
  console.log('Form element:', form);
  
  if (!modal || !form) {
    console.error('Modal or form not found!');
    return;
  }
  
  // Reset form
  form.reset();
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('matchDate').value = today;
  
  console.log('Adding show class to modal');
  modal.classList.add('show');
}

// Handle Add Match form submission
async function handleAddMatch(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const result = formData.get('result');
  const scoreTeam = parseInt(formData.get('scoreTeam'));
  const scoreOpponent = parseInt(formData.get('scoreOpponent'));
  
  // Validate score matches result
  if (result === 'win' && scoreTeam <= scoreOpponent) {
    alert('Team score must be higher than opponent score for a win!');
    return;
  }
  if (result === 'loss' && scoreTeam >= scoreOpponent) {
    alert('Team score must be lower than opponent score for a loss!');
    return;
  }
  
  try {
    showLoading();
    
    // Get current user
    const { supabase } = await import('../supabase-client.js');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const averageKda = formData.get('averageKda');
    
    // Note: team_id is now automatically added by the API
    const matchData = {
      match_date: formData.get('matchDate'),
      opponent_name: formData.get('opponentName'),
      result: result,
      match_type: formData.get('matchType'),
      score_team: scoreTeam,
      score_opponent: scoreOpponent,
      average_kda: averageKda ? parseFloat(averageKda) : null,
      notes: formData.get('notes') || null
    };
    
    console.log('Creating match with data:', matchData);
    await matchesAPI.create(matchData);
    
    // Close modal and reload
    document.getElementById('addMatchModal').classList.remove('show');
    await loadMatches();
    
    showSuccess('Match added successfully!');
  } catch (error) {
    console.error('Error adding match:', error);
    showError('Failed to add match. Please try again.');
  } finally {
    hideLoading();
  }
}

// Open Edit Match Modal
window.openEditMatchModal = function(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;
  
  currentEditingMatchId = matchId;
  
  // Populate form
  document.getElementById('editMatchId').value = match.id;
  document.getElementById('editMatchDate').value = match.match_date;
  document.getElementById('editOpponentName').value = match.opponent_name;
  document.querySelector(`input[name="editResult"][value="${match.result}"]`).checked = true;
  document.getElementById('editMatchType').value = match.match_type;
  document.getElementById('editScoreTeam').value = match.score_team;
  document.getElementById('editScoreOpponent').value = match.score_opponent;
  document.getElementById('editAverageKda').value = match.average_kda || '';
  document.getElementById('editNotes').value = match.notes || '';
  
  // Show modal
  document.getElementById('editMatchModal').classList.add('show');
};

// Handle Edit Match form submission
async function handleEditMatch(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const result = formData.get('editResult');
  const scoreTeam = parseInt(formData.get('scoreTeam'));
  const scoreOpponent = parseInt(formData.get('scoreOpponent'));
  
  // Validate score matches result
  if (result === 'win' && scoreTeam <= scoreOpponent) {
    alert('Team score must be higher than opponent score for a win!');
    return;
  }
  if (result === 'loss' && scoreTeam >= scoreOpponent) {
    alert('Team score must be lower than opponent score for a loss!');
    return;
  }
  
  const averageKda = formData.get('averageKda');
  
  const matchData = {
    match_date: formData.get('matchDate'),
    opponent_name: formData.get('opponentName'),
    result: result,
    match_type: formData.get('matchType'),
    score_team: scoreTeam,
    score_opponent: scoreOpponent,
    average_kda: averageKda ? parseFloat(averageKda) : null,
    notes: formData.get('notes') || null
  };
  
  try {
    showLoading();
    await matchesAPI.update(currentEditingMatchId, matchData);
    
    // Close modal and reload
    document.getElementById('editMatchModal').classList.remove('show');
    await loadMatches();
    
    showSuccess('Match updated successfully!');
  } catch (error) {
    console.error('Error updating match:', error);
    showError('Failed to update match. Please try again.');
  } finally {
    hideLoading();
  }
}

// Handle Delete Match
window.handleDeleteMatch = async function(matchId, opponentName) {
  if (!confirm(`Are you sure you want to delete the match vs ${opponentName}? This action cannot be undone.`)) {
    return;
  }
  
  try {
    showLoading();
    await matchesAPI.delete(matchId);
    await loadMatches();
    showSuccess('Match deleted successfully!');
  } catch (error) {
    console.error('Error deleting match:', error);
    showError('Failed to delete match. Please try again.');
  } finally {
    hideLoading();
  }
};

// Show match notes in alert (can be enhanced with a modal later)
window.showMatchNotes = function(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (match && match.notes) {
    alert(`Notes for ${match.opponent_name}:\n\n${match.notes}`);
  }
};

// Loading and error states
function showLoading() {
  const tbody = document.getElementById('matchTableBody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Loading matches...</td></tr>';
  }
}

function hideLoading() {
  // Loading is removed when data is displayed
}

function showError(message) {
  alert(message);
}

function showSuccess(message) {
  // Simple success message (can be enhanced with a toast notification)
  alert(message);
}
