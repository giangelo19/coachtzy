// Players page functionality
import { supabase } from '../supabase-client.js';
import { playersAPI } from '../api/players.js';

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
                <td colspan="6" style="text-align: center; padding: 40px;">
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
                    <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <div>
                                <p style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">No players found</p>
                                <p style="font-size: 14px;">Click "Add Player" to create your first player</p>
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
                <td colspan="6" style="text-align: center; padding: 40px;">
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
    
    tr.appendChild(nameTd);
    tr.appendChild(roleTd);
    tr.appendChild(heroesTd);
    tr.appendChild(kdaTd);
    tr.appendChild(winrateTd);
    tr.appendChild(statusTd);
    
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

// Initialize the page
async function init() {
    console.log('Players page initializing...');
    
    // Check authentication first
    const user = await checkAuth();
    if (!user) return;
    
    console.log('User authenticated:', user.email);
    
    // Load players
    await loadPlayers();
    
    // Load teams for dropdown
    await loadTeams();
    
    // Set up event listeners
    setupModalEventListeners();
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
        });
    }

    // Close modal
    const closeModal = () => {
        modal.classList.remove('show');
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

        // Get form data
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

        console.log('Creating player:', playerData);

        // Add player to database
        const newPlayer = await playersAPI.create(playerData);
        console.log('Player created:', newPlayer);

        // Show success message
        showNotification('Player added successfully!', 'success');

        // Close modal and reset form
        document.getElementById('addPlayerModal').classList.remove('show');
        form.reset();

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
