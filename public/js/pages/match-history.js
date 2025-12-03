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
    
    // Check if there's a match ID in the URL to open
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get('match');
    if (matchId) {
      // Wait a bit for the page to fully load, then open the modal
      setTimeout(() => {
        window.viewMatchDetails(matchId);
      }, 300);
    }
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
    <tr onclick="window.viewMatchDetails('${match.id}')" style="cursor: pointer;">
      <td class="date-cell">${date}</td>
      <td class="opponent-cell">
        <a href="#" class="opponent-link" onclick="event.stopPropagation();">${match.opponent_name}</a>
      </td>
      <td class="status-cell">
        <span class="match-status ${resultClass}">${resultText}</span>
      </td>
      <td class="result-cell">${score}</td>
      <td class="type-cell">${matchType}</td>
      <td class="kda-cell">${kda}</td>
      <td class="notes-cell">
        ${match.notes ? `
          <button class="btn-notes" onclick="event.stopPropagation(); window.showMatchNotes('${match.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Notes
          </button>
        ` : '<span style="color: #95a5a6;">—</span>'}
      </td>
      <td class="actions-cell">
        <button class="btn-icon btn-edit" onclick="event.stopPropagation(); window.openEditMatchModal('${match.id}')" title="Edit Match">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="btn-icon btn-delete" onclick="event.stopPropagation(); window.handleDeleteMatch('${match.id}', '${match.opponent_name}')" title="Delete Match">
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

  // Match Details Modal
  const matchDetailsModal = document.getElementById('matchDetailsModal');
  const closeMatchDetailsModal = document.getElementById('closeMatchDetailsModal');
  const closeMatchDetailsBtn = document.getElementById('closeMatchDetailsBtn');

  if (closeMatchDetailsModal) {
    closeMatchDetailsModal.addEventListener('click', () => {
      matchDetailsModal.classList.remove('show');
    });
  }

  if (closeMatchDetailsBtn) {
    closeMatchDetailsBtn.addEventListener('click', () => {
      matchDetailsModal.classList.remove('show');
    });
  }

  // Close modals on outside click
  window.addEventListener('click', (e) => {
    if (e.target === addMatchModal) {
      addMatchModal.classList.remove('show');
    }
    if (e.target === editMatchModal) {
      editMatchModal.classList.remove('show');
    }
    if (e.target === matchDetailsModal) {
      matchDetailsModal.classList.remove('show');
    }
  });
}

// Open Add Match Modal
async function openAddMatchModal() {
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
  
  // Load player stats form
  await loadPlayerStatsForm();
  
  console.log('Adding show class to modal');
  modal.classList.add('show');
}

// Load player stats form
async function loadPlayerStatsForm() {
  try {
    const { playersAPI } = await import('../api/players.js');
    const { heroesAPI } = await import('../api/heroes.js');
    
    const [players, heroes] = await Promise.all([
      playersAPI.getAll(),
      heroesAPI.getAll()
    ]);
    
    const container = document.getElementById('playerStatsForm');
    
    if (!players || players.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No players found. Please add players to your team first.</p>';
      return;
    }
    
    container.innerHTML = players.map((player, index) => `
      <div class="player-stat-form-card" style="background: var(--bg-card-dark); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <h4 style="margin-bottom: 12px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          <img src="${player.profile_picture || '/assets/default_pfp.png'}" alt="${player.name}" style="width: 24px; height: 24px; border-radius: 50%;" onerror="this.src='/assets/default_pfp.png'" />
          ${player.name}
        </h4>
        <input type="hidden" name="player_${index}_id" value="${player.id}" />
        
        <div class="form-row">
          <div class="form-group">
            <label for="player_${index}_hero">Hero*</label>
            <select id="player_${index}_hero" name="player_${index}_hero" required>
              <option value="">Select Hero</option>
              ${heroes.map(hero => `<option value="${hero.id}">${hero.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="player_${index}_role">Role*</label>
            <select id="player_${index}_role" name="player_${index}_role" required>
              <option value="">Select Role</option>
              <option value="gold_lane">Gold Lane</option>
              <option value="mid_lane">Mid Lane</option>
              <option value="exp_lane">EXP Lane</option>
              <option value="jungle">Jungle</option>
              <option value="roam">Roam</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="player_${index}_kills">Kills*</label>
            <input type="number" id="player_${index}_kills" name="player_${index}_kills" min="0" max="50" placeholder="0" required />
          </div>
          <div class="form-group">
            <label for="player_${index}_deaths">Deaths*</label>
            <input type="number" id="player_${index}_deaths" name="player_${index}_deaths" min="0" max="50" placeholder="0" required />
          </div>
          <div class="form-group">
            <label for="player_${index}_assists">Assists*</label>
            <input type="number" id="player_${index}_assists" name="player_${index}_assists" min="0" max="50" placeholder="0" required />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="player_${index}_damage">Damage Dealt*</label>
            <input type="number" id="player_${index}_damage" name="player_${index}_damage" min="0" step="0.01" placeholder="125400.50" required />
          </div>
          <div class="form-group">
            <label for="player_${index}_gold">Gold Earned*</label>
            <input type="number" id="player_${index}_gold" name="player_${index}_gold" min="0" step="0.01" placeholder="18200.00" required />
          </div>
          <div class="form-group">
            <label for="player_${index}_mvp" style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="player_${index}_mvp" name="player_${index}_mvp" value="true" style="width: auto;" />
              <span>MVP</span>
            </label>
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading player stats form:', error);
    document.getElementById('playerStatsForm').innerHTML = '<p style="color: var(--error); text-align: center; padding: 20px;">Failed to load players. Please try again.</p>';
  }
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
  
  // Collect player stats
  const playerStats = [];
  let mvpCount = 0;
  let playerIndex = 0;
  
  while (formData.has(`player_${playerIndex}_id`)) {
    const stats = {
      player_id: formData.get(`player_${playerIndex}_id`),
      hero_id: formData.get(`player_${playerIndex}_hero`),
      role: formData.get(`player_${playerIndex}_role`),
      kills: parseInt(formData.get(`player_${playerIndex}_kills`)),
      deaths: parseInt(formData.get(`player_${playerIndex}_deaths`)),
      assists: parseInt(formData.get(`player_${playerIndex}_assists`)),
      damage_dealt: parseFloat(formData.get(`player_${playerIndex}_damage`)),
      gold_earned: parseFloat(formData.get(`player_${playerIndex}_gold`)),
      is_mvp: formData.get(`player_${playerIndex}_mvp`) === 'true'
    };
    
    // Validate player stats
    if (!stats.hero_id || !stats.role) {
      alert(`Please select a hero and role for player ${playerIndex + 1}`);
      return;
    }
    
    if (stats.is_mvp) mvpCount++;
    
    playerStats.push(stats);
    playerIndex++;
  }
  
  // Validate MVP selection
  if (mvpCount === 0) {
    alert('Please select one player as MVP');
    return;
  }
  if (mvpCount > 1) {
    alert('Only one player can be selected as MVP');
    return;
  }
  
  // Validate we have player stats
  if (playerStats.length === 0) {
    alert('Please add player statistics');
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
    
    const matchDuration = formData.get('matchDuration');
    
    // Calculate average KDA from player stats
    let averageKda = null;
    if (playerStats.length > 0) {
      const totalKda = playerStats.reduce((sum, stats) => {
        const playerKda = stats.deaths === 0 
          ? (stats.kills + stats.assists) 
          : (stats.kills + stats.assists) / stats.deaths;
        return sum + playerKda;
      }, 0);
      averageKda = totalKda / playerStats.length;
    }
    
    // Note: team_id is now automatically added by the API
    const matchData = {
      match_date: formData.get('matchDate'),
      opponent_name: formData.get('opponentName'),
      result: result,
      match_type: formData.get('matchType'),
      score_team: scoreTeam,
      score_opponent: scoreOpponent,
      match_duration: matchDuration ? parseInt(matchDuration) : null,
      average_kda: averageKda,
      notes: formData.get('notes') || null
    };
    
    console.log('Creating match with data:', matchData);
    const newMatch = await matchesAPI.create(matchData);
    
    // Insert player stats
    console.log('Inserting player stats:', playerStats);
    for (const stats of playerStats) {
      const { data, error } = await supabase
        .from('match_players')
        .insert({
          match_id: newMatch.id,
          ...stats
        });
      
      if (error) {
        console.error('Error inserting player stats:', error);
        throw error;
      }
    }
    
    // Close modal and reload
    document.getElementById('addMatchModal').classList.remove('show');
    await loadMatches();
    
    showSuccess('Match and player statistics added successfully!');
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

// View Match Details
window.viewMatchDetails = async function(matchId) {
  try {
    console.log('Loading match details for ID:', matchId);
    
    // Fetch full match details with player stats
    const matchDetails = await matchesAPI.getById(matchId);
    
    console.log('Match details fetched:', matchDetails);
    
    if (!matchDetails) {
      throw new Error('Match not found');
    }
    
    // Populate modal with match details
    populateMatchDetailsModal(matchDetails);
    
    // Show modal
    const modal = document.getElementById('matchDetailsModal');
    if (modal) {
      modal.classList.add('show');
      console.log('Modal opened successfully');
    } else {
      console.error('Match details modal not found in DOM');
    }
  } catch (error) {
    console.error('Error loading match details:', error);
    showError('Failed to load match details. Please try again.');
  }
};

// Populate Match Details Modal
function populateMatchDetailsModal(match) {
  console.log('Populating modal with match data:', match);
  
  // Match Summary
  const resultBadge = document.getElementById('detailsResultBadge');
  const resultClass = match.result === 'win' ? 'win' : 'loss';
  const resultText = match.result === 'win' ? 'Victory' : 'Defeat';
  resultBadge.textContent = resultText;
  resultBadge.className = `result-badge ${resultClass}`;
  
  document.getElementById('detailsScore').textContent = `${match.score_team} - ${match.score_opponent}`;
  document.getElementById('detailsDurationText').textContent = match.match_duration || '—';
  document.getElementById('detailsDate').textContent = formatFullDate(match.match_date);
  document.getElementById('detailsOpponent').textContent = `vs ${match.opponent_name}`;
  document.getElementById('detailsType').textContent = match.match_type.charAt(0).toUpperCase() + match.match_type.slice(1);
  
  // Player Stats
  const playerStatsContainer = document.getElementById('playerStatsRows');
  
  console.log('Player data:', match.match_players);
  
  if (!match.match_players || match.match_players.length === 0) {
    console.log('No player stats found for this match');
    playerStatsContainer.innerHTML = `
      <div style="padding: 40px; text-align: center; color: var(--text-secondary); grid-column: 1 / -1;">
        <p>No player statistics available for this match.</p>
        <p style="font-size: 12px; margin-top: 8px;">Add player data to see detailed performance metrics.</p>
      </div>
    `;
  } else {
    console.log(`Found ${match.match_players.length} players`);
    // Sort players by KDA (MVP first)
    const sortedPlayers = [...match.match_players].sort((a, b) => {
      if (a.is_mvp) return -1;
      if (b.is_mvp) return 1;
      return (b.kda || 0) - (a.kda || 0);
    });
    
    playerStatsContainer.innerHTML = sortedPlayers.map(player => createPlayerStatsRow(player)).join('');
  }
  
  // Team Statistics Summary
  if (match.match_players && match.match_players.length > 0) {
    const totalKills = match.match_players.reduce((sum, p) => sum + (p.kills || 0), 0);
    const totalDeaths = match.match_players.reduce((sum, p) => sum + (p.deaths || 0), 0);
    const totalAssists = match.match_players.reduce((sum, p) => sum + (p.assists || 0), 0);
    const totalDamage = match.match_players.reduce((sum, p) => sum + (p.damage_dealt || 0), 0);
    const totalGold = match.match_players.reduce((sum, p) => sum + (p.gold_earned || 0), 0);
    const teamKDA = totalDeaths === 0 ? totalKills + totalAssists : ((totalKills + totalAssists) / totalDeaths).toFixed(1);
    
    document.getElementById('summaryKills').textContent = totalKills;
    document.getElementById('summaryDeaths').textContent = totalDeaths;
    document.getElementById('summaryAssists').textContent = totalAssists;
    
    const kdaElement = document.getElementById('summaryKDA');
    kdaElement.textContent = teamKDA;
    kdaElement.className = 'summary-value ' + (teamKDA >= 3 ? 'positive' : '');
    
    document.getElementById('summaryDamage').textContent = formatNumber(totalDamage);
    document.getElementById('summaryGold').textContent = formatNumber(totalGold);
  } else {
    document.getElementById('summaryKills').textContent = '0';
    document.getElementById('summaryDeaths').textContent = '0';
    document.getElementById('summaryAssists').textContent = '0';
    document.getElementById('summaryKDA').textContent = '0.0';
    document.getElementById('summaryDamage').textContent = '0';
    document.getElementById('summaryGold').textContent = '0';
  }
  
  // Match Notes
  const notesSection = document.getElementById('matchNotesSection');
  const notesContent = document.getElementById('matchNotesContent');
  
  if (match.notes) {
    notesSection.style.display = 'block';
    notesContent.textContent = match.notes;
  } else {
    notesSection.style.display = 'none';
  }
}

// Create Player Stats Row HTML
function createPlayerStatsRow(player) {
  const playerName = player.player?.name || 'Unknown Player';
  const playerAvatar = player.player?.profile_picture || '/assets/default_pfp.png';
  const heroName = player.hero?.name || 'Unknown Hero';
  const heroIcon = player.hero?.icon || '/assets/heroes/default.png';
  const rawRole = player.role || 'Unknown';
  
  // Format role for display and CSS class
  const roleMap = {
    'gold_lane': { display: 'Gold', cssClass: 'gold' },
    'mid_lane': { display: 'Mid', cssClass: 'mid' },
    'exp_lane': { display: 'EXP', cssClass: 'exp' },
    'jungle': { display: 'Jungle', cssClass: 'jungle' },
    'roam': { display: 'Roam', cssClass: 'roam' }
  };
  
  const roleInfo = roleMap[rawRole] || { display: rawRole, cssClass: rawRole.toLowerCase() };
  
  const kills = player.kills || 0;
  const deaths = player.deaths || 0;
  const assists = player.assists || 0;
  const kda = player.kda ? parseFloat(player.kda).toFixed(1) : '0.0';
  const kdaClass = kda >= 5 ? 'positive' : kda < 2 ? 'negative' : '';
  const damage = formatNumber(player.damage_dealt || 0);
  const gold = formatNumber(player.gold_earned || 0);
  const isMvp = player.is_mvp;
  
  return `
    <div class="stats-row ${isMvp ? 'mvp-row' : ''}">
      <div class="col-player">
        <img src="${playerAvatar}" alt="${playerName}" class="player-avatar-small" onerror="this.src='/assets/default_pfp.png'" />
        <span class="player-name">${playerName}</span>
      </div>
      <div class="col-role">
        <span class="role-badge ${roleInfo.cssClass}">${roleInfo.display}</span>
      </div>
      <div class="col-hero">
        <img src="${heroIcon}" alt="${heroName}" class="hero-icon" onerror="this.src='/assets/heroes/default.png'" />
        <span class="hero-name">${heroName}</span>
      </div>
      <div class="col-kda">
        <span class="kills">${kills}</span> / 
        <span class="deaths">${deaths}</span> / 
        <span class="assists">${assists}</span>
        <span class="kda-ratio ${kdaClass}">${kda}</span>
      </div>
      <div class="col-stat">
        <span class="stat-value" style="font-size: 15px;">${damage}</span>
      </div>
      <div class="col-stat">
        <span class="stat-value" style="font-size: 15px;">${gold}</span>
      </div>
      <div class="col-mvp">
        ${isMvp ? `
          <span class="mvp-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            MVP
          </span>
        ` : ''}
      </div>
    </div>
  `;
}

// Helper function to format full date
function formatFullDate(dateString) {
  const date = new Date(dateString);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

// Helper function to format numbers (e.g., 125400 -> 125.4k)
function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}
