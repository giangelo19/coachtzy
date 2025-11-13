// Players page functionality
import { supabase } from '../supabase-client.js';
import { playersAPI } from '../api/players.js';
import { heroesAPI } from '../api/heroes.js';

// Store selected heroes
let selectedHeroes = [];
let allHeroes = [];

// Check authentication
async function checkAuth() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        console.log('User not authenticated, redirecting to login...');
        window.location.href = '/login.html';
        return null;
    }
    
    return user;
}

// Load and display players
async function loadPlayers() {
    const tbody = document.querySelector('.players-table tbody');
    
    if (!tbody) {
        console.error('Players table body not found');
        return;
    }

    try {
        // Show loading state
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <div class="loading-spinner"></div>
                        <span>Loading players...</span>
                    </div>
                </td>
            </tr>
        `;

        // Fetch players from database
        console.log('Fetching players from database...');
        const players = await playersAPI.getAll();
        console.log('Players loaded:', players);

        // Clear loading state
        tbody.innerHTML = '';

        // Check if there are players
        if (!players || players.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 60px 40px; color: #95a5a6;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5;">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <div>
                                <p style="font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #e0e0e0;">No players found</p>
                                <p style="font-size: 15px; color: #95a5a6;">Click "Add Player" to create your first player</p>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Display each player
        players.forEach(player => {
            const row = createPlayerRow(player);
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading players:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div style="color: #dc3545;">
                        <p style="font-weight: 600; margin-bottom: 10px;">❌ Error Loading Players</p>
                        <p style="font-size: 14px;">${error.message}</p>
                        <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Create a table row for a player
function createPlayerRow(player) {
    const tr = document.createElement('tr');
    
    // Player Name
    const nameTd = document.createElement('td');
    nameTd.className = 'player-name';
    nameTd.textContent = player.name || 'Unknown Player';
    
    // Role
    const roleTd = document.createElement('td');
    roleTd.className = 'role-cell';
    roleTd.innerHTML = createRoleIcon(player.role);
    
    // Main Heroes
    const heroesTd = document.createElement('td');
    heroesTd.className = 'heroes-cell';
    heroesTd.innerHTML = createHeroIcons(player.player_heroes);
    
    // Average KDA
    const kdaTd = document.createElement('td');
    kdaTd.className = 'kda-cell';
    kdaTd.textContent = player.average_kda ? player.average_kda.toFixed(1) : 'N/A';
    
    // Winrate
    const winrateTd = document.createElement('td');
    winrateTd.className = 'winrate-cell';
    winrateTd.textContent = player.winrate ? `${player.winrate.toFixed(0)}%` : 'N/A';
    
    // Status
    const statusTd = document.createElement('td');
    statusTd.className = 'status-cell';
    statusTd.innerHTML = `<span class="status-badge ${player.status || 'active'}">${player.status || 'Active'}</span>`;
    
    // Actions
    const actionsTd = document.createElement('td');
    actionsTd.className = 'actions-cell';
    actionsTd.innerHTML = `
        <button class="btn-edit" data-player-id="${player.id}" title="Edit Player">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        </button>
        <button class="btn-delete" data-player-id="${player.id}" title="Delete Player">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        </button>
    `;
    
    tr.appendChild(nameTd);
    tr.appendChild(roleTd);
    tr.appendChild(heroesTd);
    tr.appendChild(kdaTd);
    tr.appendChild(winrateTd);
    tr.appendChild(statusTd);
    tr.appendChild(actionsTd);
    
    // Add event listeners for action buttons
    const editBtn = actionsTd.querySelector('.btn-edit');
    const deleteBtn = actionsTd.querySelector('.btn-delete');
    
    editBtn.addEventListener('click', () => openEditModal(player));
    deleteBtn.addEventListener('click', () => handleDeletePlayer(player.id, player.name));
    
    return tr;
}

// Create role icon HTML
function createRoleIcon(role) {
    const roleMap = {
        'exp_lane': { icon: 'expLane.png', label: 'Exp' },
        'jungle': { icon: 'jungle.png', label: 'Jungle' },
        'mid_lane': { icon: 'midLane.png', label: 'Mid' },
        'gold_lane': { icon: 'goldLane.png', label: 'Gold' },
        'roam': { icon: 'roam.png', label: 'Roam' }
    };
    
    const roleInfo = roleMap[role] || { icon: 'placeholder.jpg', label: role || 'Unknown' };
    
    return `
        <div class="role-icon-container" title="${roleInfo.label} Lane">
            <img src="/assets/${roleInfo.icon}" alt="${roleInfo.label}" class="role-icon-img" />
            <span class="role-label">${roleInfo.label}</span>
        </div>
    `;
}

// Create hero icons HTML
function createHeroIcons(playerHeroes) {
    if (!playerHeroes || playerHeroes.length === 0) {
        return '<div class="hero-icons"><span style="color: #666; font-size: 14px;">No heroes</span></div>';
    }
    
    // Show up to 3 heroes
    const heroes = playerHeroes.slice(0, 3);
    const heroHTML = heroes.map(ph => {
        const hero = ph.hero || {};
        const iconUrl = hero.icon || '/assets/placeholder.jpg';
        const heroName = hero.name || 'Unknown';
        
        return `<img src="${iconUrl}" alt="${heroName}" class="hero-icon" title="${heroName}" />`;
    }).join('');
    
    return `<div class="hero-icons">${heroHTML}</div>`;
}

// Load heroes for selection
async function loadHeroesForSelection() {
    try {
        allHeroes = await heroesAPI.getAll();
        console.log(`Loaded ${allHeroes.length} heroes for selection`);
    } catch (error) {
        console.error('Error loading heroes:', error);
    }
}

// Setup hero selection
function setupHeroSelection() {
    const heroSearch = document.getElementById('heroSearch');
    const heroSearchResults = document.getElementById('heroSearchResults');

    if (!heroSearch || !heroSearchResults) return;

    // Search heroes
    heroSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm.length === 0) {
            heroSearchResults.classList.remove('show');
            return;
        }

        const filteredHeroes = allHeroes.filter(hero => 
            hero.name.toLowerCase().includes(searchTerm) &&
            !selectedHeroes.some(sh => sh.id === hero.id)
        );

        displayHeroSearchResults(filteredHeroes);
        heroSearchResults.classList.add('show');
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!heroSearch.contains(e.target) && !heroSearchResults.contains(e.target)) {
            heroSearchResults.classList.remove('show');
        }
    });
}

// Display hero search results
function displayHeroSearchResults(heroes) {
    const heroSearchResults = document.getElementById('heroSearchResults');
    
    if (heroes.length === 0) {
        heroSearchResults.innerHTML = '<div style="padding: 15px; text-align: center; color: #666;">No heroes found</div>';
        return;
    }

    const maxReached = selectedHeroes.length >= 3;

    heroSearchResults.innerHTML = heroes.map(hero => `
        <div class="hero-result-item ${maxReached ? 'disabled' : ''}" data-hero-id="${hero.id}">
            <img src="${hero.icon || '/assets/placeholder.jpg'}" alt="${hero.name}" onerror="this.src='/assets/placeholder.jpg'" />
            <div class="hero-result-info">
                <div class="hero-result-name">${hero.name}</div>
                <div class="hero-result-roles">
                    <span class="hero-result-role-badge">${hero.role1}</span>
                    ${hero.role2 ? `<span class="hero-result-role-badge">${hero.role2}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Add click handlers
    heroSearchResults.querySelectorAll('.hero-result-item:not(.disabled)').forEach(item => {
        item.addEventListener('click', () => {
            const heroId = item.dataset.heroId;
            const hero = heroes.find(h => h.id === heroId);
            if (hero) {
                addHeroToSelection(hero);
            }
        });
    });
}

// Add hero to selection
function addHeroToSelection(hero) {
    if (selectedHeroes.length >= 3) {
        showNotification('You can only select up to 3 heroes', 'error');
        return;
    }

    if (selectedHeroes.some(h => h.id === hero.id)) {
        return;
    }

    selectedHeroes.push(hero);
    updateSelectedHeroesDisplay();
    
    // Clear search
    document.getElementById('heroSearch').value = '';
    document.getElementById('heroSearchResults').classList.remove('show');
}

// Remove hero from selection
function removeHeroFromSelection(heroId) {
    selectedHeroes = selectedHeroes.filter(h => h.id !== heroId);
    updateSelectedHeroesDisplay();
}

// Update selected heroes display
function updateSelectedHeroesDisplay() {
    const container = document.getElementById('selectedHeroes');
    
    if (selectedHeroes.length === 0) {
        container.innerHTML = '<div class="empty-hero-slot">Click below to search and select heroes</div>';
        return;
    }

    container.innerHTML = selectedHeroes.map(hero => `
        <div class="selected-hero-card">
            <img src="${hero.icon || '/assets/placeholder.jpg'}" alt="${hero.name}" onerror="this.src='/assets/placeholder.jpg'" />
            <div class="selected-hero-info">
                <div class="selected-hero-name">${hero.name}</div>
                <div class="selected-hero-role">${hero.role1}${hero.role2 ? ` / ${hero.role2}` : ''}</div>
            </div>
            <button type="button" class="remove-hero-btn" data-hero-id="${hero.id}">×</button>
        </div>
    `).join('');

    // Add remove handlers
    container.querySelectorAll('.remove-hero-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            removeHeroFromSelection(btn.dataset.heroId);
        });
    });
}

// Initialize the page
async function init() {
    console.log('Players page initializing...');
    
    // Check authentication first
    const user = await checkAuth();
    if (!user) return;
    
    console.log('User authenticated:', user.email);
    
    // Load heroes for selection
    await loadHeroesForSelection();
    
    // Load players
    await loadPlayers();
    
    // Load teams for dropdown
    await loadTeams();
    
    // Set up event listeners
    setupModalEventListeners();
    setupEditModalEventListeners();
    
    // Setup hero selection
    setupHeroSelection();
}

// Load teams for the team dropdown
async function loadTeams() {
    const teamSelect = document.getElementById('playerTeam');
    if (!teamSelect) return;

    try {
        const { data: teams, error } = await supabase
            .from('teams')
            .select('id, name')
            .order('name');

        if (error) throw error;

        teamSelect.innerHTML = '<option value="">Select Team (Optional)</option>';
        
        if (teams && teams.length > 0) {
            teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.id;
                option.textContent = team.name;
                teamSelect.appendChild(option);
            });
        } else {
            teamSelect.innerHTML = '<option value="">No teams available</option>';
        }
    } catch (error) {
        console.error('Error loading teams:', error);
        teamSelect.innerHTML = '<option value="">Error loading teams</option>';
    }
}

// Set up modal event listeners
function setupModalEventListeners() {
    const modal = document.getElementById('addPlayerModal');
    const addPlayerBtn = document.querySelector('.btn-primary');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('addPlayerForm');

    // Open modal
    if (addPlayerBtn) {
        addPlayerBtn.addEventListener('click', () => {
            modal.classList.add('show');
            form.reset();
            selectedHeroes = [];
            updateSelectedHeroesDisplay();
        });
    }

    // Close modal
    const closeModal = () => {
        modal.classList.remove('show');
        selectedHeroes = [];
        updateSelectedHeroesDisplay();
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Handle form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAddPlayer(form);
        });
    }
}

// Handle adding a new player
async function handleAddPlayer(form) {
    const submitBtn = document.getElementById('submitPlayerBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    try {
        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';

        // Get current user
        const { supabase } = await import('../supabase-client.js');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Get form data
        const formData = new FormData(form);
        const playerData = {
            user_id: user.id,
            name: formData.get('playerName').trim(),
            role: formData.get('playerRole'),
            status: formData.get('playerStatus'),
            team_id: formData.get('playerTeam') || null,
            average_kda: formData.get('playerKDA') ? parseFloat(formData.get('playerKDA')) : null,
            winrate: formData.get('playerWinrate') ? parseFloat(formData.get('playerWinrate')) : null
        };

        // Validate required fields
        if (!playerData.name || !playerData.role || !playerData.status) {
            throw new Error('Please fill in all required fields');
        }

        // Validate hero selection
        if (selectedHeroes.length === 0) {
            throw new Error('Please select at least one main hero');
        }

        console.log('Creating player:', playerData);

        // Add player to database
        const newPlayer = await playersAPI.create(playerData);
        console.log('Player created:', newPlayer);

        // Add selected heroes to player
        for (const hero of selectedHeroes) {
            await playersAPI.addHero(newPlayer.id, hero.id, {
                games_played: 0,
                wins: 0,
                losses: 0,
                average_kda: 0
            });
        }
        console.log('Heroes added to player');

        // Show success message
        showNotification('Player added successfully!', 'success');

        // Close modal and reset form
        document.getElementById('addPlayerModal').classList.remove('show');
        form.reset();
        selectedHeroes = [];
        updateSelectedHeroesDisplay();

        // Reload players table
        await loadPlayers();

    } catch (error) {
        console.error('Error adding player:', error);
        showNotification(error.message || 'Failed to add player. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// Open edit modal with player data
async function openEditModal(player) {
    const modal = document.getElementById('editPlayerModal');
    const form = document.getElementById('editPlayerForm');
    
    // Reset and show modal
    modal.classList.add('show');
    
    // Fill form with player data
    document.getElementById('editPlayerId').value = player.id;
    document.getElementById('editPlayerName').value = player.name;
    document.getElementById('editPlayerRole').value = player.role;
    document.getElementById('editPlayerKDA').value = player.average_kda || '';
    document.getElementById('editPlayerWinrate').value = player.winrate || '';
    document.getElementById('editPlayerStatus').value = player.status;
    document.getElementById('editPlayerTeam').value = player.team_id || '';
    
    // Load player's current heroes
    selectedHeroes = [];
    if (player.player_heroes && player.player_heroes.length > 0) {
        selectedHeroes = player.player_heroes.map(ph => ph.hero).filter(h => h);
    }
    updateEditSelectedHeroesDisplay();
    
    // Setup edit hero selection
    setupEditHeroSelection();
}

// Setup hero selection for edit modal
function setupEditHeroSelection() {
    const heroSearch = document.getElementById('editHeroSearch');
    const heroSearchResults = document.getElementById('editHeroSearchResults');

    if (!heroSearch || !heroSearchResults) return;

    // Remove existing listeners
    const newHeroSearch = heroSearch.cloneNode(true);
    heroSearch.parentNode.replaceChild(newHeroSearch, heroSearch);

    // Search heroes
    newHeroSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm.length === 0) {
            heroSearchResults.classList.remove('show');
            return;
        }

        const filteredHeroes = allHeroes.filter(hero => 
            hero.name.toLowerCase().includes(searchTerm) &&
            !selectedHeroes.some(sh => sh.id === hero.id)
        );

        displayEditHeroSearchResults(filteredHeroes);
        heroSearchResults.classList.add('show');
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!newHeroSearch.contains(e.target) && !heroSearchResults.contains(e.target)) {
            heroSearchResults.classList.remove('show');
        }
    });
}

// Display hero search results for edit modal
function displayEditHeroSearchResults(heroes) {
    const heroSearchResults = document.getElementById('editHeroSearchResults');
    
    if (heroes.length === 0) {
        heroSearchResults.innerHTML = '<div style="padding: 15px; text-align: center; color: #666;">No heroes found</div>';
        return;
    }

    const maxReached = selectedHeroes.length >= 3;

    heroSearchResults.innerHTML = heroes.map(hero => `
        <div class="hero-result-item ${maxReached ? 'disabled' : ''}" data-hero-id="${hero.id}">
            <img src="${hero.icon || '/assets/placeholder.jpg'}" alt="${hero.name}" onerror="this.src='/assets/placeholder.jpg'" />
            <div class="hero-result-info">
                <div class="hero-result-name">${hero.name}</div>
                <div class="hero-result-roles">
                    <span class="hero-result-role-badge">${hero.role1}</span>
                    ${hero.role2 ? `<span class="hero-result-role-badge">${hero.role2}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Add click handlers
    heroSearchResults.querySelectorAll('.hero-result-item:not(.disabled)').forEach(item => {
        item.addEventListener('click', () => {
            const heroId = item.dataset.heroId;
            const hero = heroes.find(h => h.id === heroId);
            if (hero) {
                addHeroToEditSelection(hero);
            }
        });
    });
}

// Add hero to edit selection
function addHeroToEditSelection(hero) {
    if (selectedHeroes.length >= 3) {
        showNotification('You can only select up to 3 heroes', 'error');
        return;
    }

    if (selectedHeroes.some(h => h.id === hero.id)) {
        return;
    }

    selectedHeroes.push(hero);
    updateEditSelectedHeroesDisplay();
    
    // Clear search
    document.getElementById('editHeroSearch').value = '';
    document.getElementById('editHeroSearchResults').classList.remove('show');
}

// Update selected heroes display for edit modal
function updateEditSelectedHeroesDisplay() {
    const container = document.getElementById('editSelectedHeroes');
    
    if (selectedHeroes.length === 0) {
        container.innerHTML = '<div class="empty-hero-slot">Click below to search and select heroes</div>';
        return;
    }

    container.innerHTML = selectedHeroes.map(hero => `
        <div class="selected-hero-card">
            <img src="${hero.icon || '/assets/placeholder.jpg'}" alt="${hero.name}" onerror="this.src='/assets/placeholder.jpg'" />
            <div class="selected-hero-info">
                <div class="selected-hero-name">${hero.name}</div>
                <div class="selected-hero-role">${hero.role1}${hero.role2 ? ` / ${hero.role2}` : ''}</div>
            </div>
            <button type="button" class="remove-hero-btn" data-hero-id="${hero.id}">×</button>
        </div>
    `).join('');

    // Add remove handlers
    container.querySelectorAll('.remove-hero-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedHeroes = selectedHeroes.filter(h => h.id !== btn.dataset.heroId);
            updateEditSelectedHeroesDisplay();
        });
    });
}

// Setup edit modal event listeners
function setupEditModalEventListeners() {
    const modal = document.getElementById('editPlayerModal');
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const form = document.getElementById('editPlayerForm');

    // Close modal
    const closeModal = () => {
        modal.classList.remove('show');
        selectedHeroes = [];
        updateEditSelectedHeroesDisplay();
    };

    if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Handle form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleEditPlayer(form);
        });
    }
}

// Handle editing a player
async function handleEditPlayer(form) {
    const submitBtn = document.getElementById('submitEditPlayerBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    try {
        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';

        const playerId = document.getElementById('editPlayerId').value;
        const formData = new FormData(form);
        const playerData = {
            name: formData.get('playerName').trim(),
            role: formData.get('playerRole'),
            status: formData.get('playerStatus'),
            team_id: formData.get('playerTeam') || null,
            average_kda: formData.get('playerKDA') ? parseFloat(formData.get('playerKDA')) : null,
            winrate: formData.get('playerWinrate') ? parseFloat(formData.get('playerWinrate')) : null
        };

        // Validate required fields
        if (!playerData.name || !playerData.role || !playerData.status) {
            throw new Error('Please fill in all required fields');
        }

        // Validate hero selection
        if (selectedHeroes.length === 0) {
            throw new Error('Please select at least one main hero');
        }

        console.log('Updating player:', playerId, playerData);

        // Update player in database
        await playersAPI.update(playerId, playerData);
        
        // Get current player heroes
        const player = await playersAPI.getById(playerId);
        const currentHeroIds = player.player_heroes ? player.player_heroes.map(ph => ph.hero_id) : [];
        const newHeroIds = selectedHeroes.map(h => h.id);
        
        // Remove heroes that are no longer selected
        for (const ph of (player.player_heroes || [])) {
            if (!newHeroIds.includes(ph.hero_id)) {
                await playersAPI.removeHero(ph.id);
            }
        }
        
        // Add new heroes
        for (const hero of selectedHeroes) {
            if (!currentHeroIds.includes(hero.id)) {
                await playersAPI.addHero(playerId, hero.id, {
                    games_played: 0,
                    wins: 0,
                    losses: 0,
                    average_kda: 0
                });
            }
        }

        console.log('Player updated successfully');

        // Show success message
        showNotification('Player updated successfully!', 'success');

        // Close modal and reset form
        document.getElementById('editPlayerModal').classList.remove('show');
        form.reset();
        selectedHeroes = [];
        updateEditSelectedHeroesDisplay();

        // Reload players table
        await loadPlayers();

    } catch (error) {
        console.error('Error updating player:', error);
        showNotification(error.message || 'Failed to update player. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// Handle deleting a player
async function handleDeletePlayer(playerId, playerName) {
    if (!confirm(`Are you sure you want to delete "${playerName}"? This action cannot be undone.`)) {
        return;
    }

    try {
        console.log('Deleting player:', playerId);
        await playersAPI.delete(playerId);
        showNotification('Player deleted successfully!', 'success');
        await loadPlayers();
    } catch (error) {
        console.error('Error deleting player:', error);
        showNotification(error.message || 'Failed to delete player. Please try again.', 'error');
    }
}

// Show notification message
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 2000;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);

// Add loading spinner styles
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .hero-icons {
        display: flex;
        gap: 5px;
        align-items: center;
    }
    
    .hero-icon {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        object-fit: cover;
        border: 1px solid #ddd;
    }
    
    .role-icon-container {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .role-icon-img {
        width: 24px;
        height: 24px;
        object-fit: contain;
    }
    
    .role-label {
        font-size: 14px;
        font-weight: 500;
    }
    
    .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: capitalize;
    }
    
    .status-badge.active {
        background: #d4edda;
        color: #155724;
    }
    
    .status-badge.inactive {
        background: #f8d7da;
        color: #721c24;
    }
    
    .status-badge.injured {
        background: #fff3cd;
        color: #856404;
    }
`;
document.head.appendChild(style);
