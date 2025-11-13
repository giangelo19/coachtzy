// Team page functionality
console.log('🚀 Team.js is loading...');

import { requireAuth, getCurrentUser } from '../auth.js';
import { teamsAPI } from '../api/teams.js';
import { playersAPI } from '../api/players.js';
import { matchesAPI } from '../api/matches.js';

console.log('✅ Imports loaded successfully');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 DOM Content Loaded event fired');
  
  try {
    // Protect this page
    console.log('🔒 Checking authentication...');
    await requireAuth();
    console.log('✅ Authentication passed');
    
    // Get current user info
    console.log('👤 Getting current user...');
    const user = await getCurrentUser();
    console.log('User:', user);
    updateUserProfile(user);

    // Load team data
    console.log('🏀 Loading team data...');
    await loadTeamData();
    
    // Setup event listeners
    console.log('🎯 Setting up event listeners...');
    setupEventListeners();
    
    console.log('✅ Team page initialized successfully!');
  } catch (error) {
    console.error('❌ Team page initialization error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
});

async function loadTeamData() {
  try {
    console.log('=== Starting loadTeamData ===');
    showLoading();

    // Get current user's team
    console.log('Fetching team...');
    const team = await teamsAPI.getCurrent();
    console.log('Team result:', team);

    if (team) {
      console.log('Team found, updating profile...');
      updateTeamProfile(team);
      
      // Fetch matches to calculate stats
      console.log('Fetching matches...');
      const matches = await matchesAPI.getAll();
      console.log('Matches result:', matches);
      console.log('Number of matches:', matches ? matches.length : 0);
      
      // Calculate stats from matches
      const stats = calculateTeamStats(matches || []);
      console.log('Calculated stats:', stats);
      updateTeamStats(stats);
      
      // Calculate and update weekly performance
      const weeklyData = calculateWeeklyPerformance(matches || []);
      console.log('Weekly performance data:', weeklyData);
      updateWeeklyPerformanceChart(weeklyData);
      
      // Load players separately using the same API as Players page
      console.log('Fetching players...');
      const players = await playersAPI.getAll();
      console.log('Players result:', players);
      console.log('Number of players:', players ? players.length : 0);
      
      updateRoster(players || []);
    } else {
      console.log('No team found, showing no team message');
      showNoTeamMessage();
    }

    hideLoading();
    console.log('=== loadTeamData complete ===');
  } catch (error) {
    console.error('Error loading team data:', error);
    console.error('Error stack:', error.stack);
    showError('Failed to load team data. Please refresh the page.');
    hideLoading();
  }
}

function calculateTeamStats(matches) {
  if (!matches || matches.length === 0) {
    return {
      total_wins: 0,
      total_losses: 0,
      total_matches: 0,
      average_kda: 0,
      winrate: 0
    };
  }
  
  const total_wins = matches.filter(m => m.result === 'win').length;
  const total_losses = matches.filter(m => m.result === 'loss').length;
  const total_matches = matches.length;
  
  // Calculate average KDA from all matches
  const totalKDA = matches.reduce((sum, match) => {
    return sum + (match.average_kda || 0);
  }, 0);
  const average_kda = total_matches > 0 ? totalKDA / total_matches : 0;
  
  // Calculate winrate
  const winrate = total_matches > 0 ? (total_wins / total_matches) * 100 : 0;
  
  return {
    total_wins,
    total_losses,
    total_matches,
    average_kda,
    winrate
  };
}

function calculateWeeklyPerformance(matches) {
  // Get last 7 days
  const today = new Date();
  const last7Days = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    last7Days.push({
      date: dateStr,
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      matches: [],
      avgKDA: 0
    });
  }
  
  // Group matches by date
  matches.forEach(match => {
    // Extract just the date part (YYYY-MM-DD) from the match_date
    const matchDate = match.match_date ? match.match_date.split('T')[0] : null;
    const dayData = last7Days.find(d => d.date === matchDate);
    
    if (dayData) {
      dayData.matches.push(match);
    }
  });
  
  // Calculate average KDA for each day
  last7Days.forEach(day => {
    if (day.matches.length > 0) {
      const totalKDA = day.matches.reduce((sum, match) => sum + (match.average_kda || 0), 0);
      day.avgKDA = totalKDA / day.matches.length;
    }
  });
  
  return last7Days;
}

function updateWeeklyPerformanceChart(weeklyData) {
  console.log('Updating weekly performance chart with:', weeklyData);
  
  // Update chart labels (dates)
  const labels = document.querySelectorAll('.chart-x-axis span');
  weeklyData.forEach((day, index) => {
    if (labels[index]) {
      labels[index].textContent = day.displayDate;
    }
  });
  
  // Update the SVG path with actual data
  const svg = document.querySelector('.line-chart');
  if (!svg) return;
  
  // Calculate points for the line chart
  const chartWidth = 700;
  const chartHeight = 200;
  const padding = 20; // Add padding so points aren't cut off
  const maxKDA = Math.max(...weeklyData.map(d => d.avgKDA), 10); // Min scale of 10
  const minKDA = 0;
  
  // Calculate point positions
  const pointsData = weeklyData.map((day, index) => {
    const x = (index / (weeklyData.length - 1)) * chartWidth;
    const ratio = (day.avgKDA - minKDA) / (maxKDA - minKDA);
    const y = chartHeight - (ratio * (chartHeight - padding)) - (padding / 2);
    return { x, y, kda: day.avgKDA, matches: day.matches.length };
  });
  
  const points = pointsData.map(p => `${p.x},${p.y}`).join(' ');
  
  // Remove old elements
  svg.querySelectorAll('.kda-line, .kda-area, .data-point, .data-point-hover').forEach(el => el.remove());
  
  // Create the filled area (add first for proper z-ordering)
  const areaPoints = `0,${chartHeight} ${points} ${chartWidth},${chartHeight}`;
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.classList.add('kda-area');
  polygon.setAttribute('fill', 'url(#teamLineGradient)');
  polygon.setAttribute('points', areaPoints);
  svg.appendChild(polygon);
  
  // Create the line with smooth curve
  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.classList.add('kda-line');
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', 'var(--accent-orange)');
  polyline.setAttribute('stroke-width', '3');
  polyline.setAttribute('stroke-linecap', 'round');
  polyline.setAttribute('stroke-linejoin', 'round');
  polyline.setAttribute('points', points);
  svg.appendChild(polyline);
  
  // Add data points (circles)
  pointsData.forEach((point, index) => {
    // Main circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.classList.add('data-point');
    circle.setAttribute('cx', point.x);
    circle.setAttribute('cy', point.y);
    circle.setAttribute('r', point.matches > 0 ? '5' : '3');
    circle.setAttribute('fill', 'var(--accent-orange)');
    circle.setAttribute('stroke', 'var(--bg-card)');
    circle.setAttribute('stroke-width', '2');
    circle.style.animationDelay = `${0.8 + index * 0.1}s`; // Stagger animation
    
    // Add hover effect
    const hoverCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hoverCircle.classList.add('data-point-hover');
    hoverCircle.setAttribute('cx', point.x);
    hoverCircle.setAttribute('cy', point.y);
    hoverCircle.setAttribute('r', '8');
    hoverCircle.setAttribute('fill', 'transparent');
    hoverCircle.setAttribute('cursor', 'pointer');
    
    // Add tooltip on hover
    hoverCircle.addEventListener('mouseenter', (e) => {
      circle.setAttribute('r', '7');
      showTooltip(point, e);
    });
    
    hoverCircle.addEventListener('mouseleave', () => {
      circle.setAttribute('r', point.matches > 0 ? '5' : '3');
      hideTooltip();
    });
    
    if (point.matches > 0) {
      svg.appendChild(circle);
      svg.appendChild(hoverCircle);
    }
  });
  
  console.log('Chart updated with', pointsData.length, 'data points');
}

function showTooltip(point, event) {
  // Create or update tooltip
  let tooltip = document.querySelector('.chart-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    document.body.appendChild(tooltip);
  }
  
  tooltip.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">KDA: ${point.kda.toFixed(2)}</div>
    <div style="font-size: 12px; color: var(--text-secondary);">${point.matches} match${point.matches !== 1 ? 'es' : ''}</div>
  `;
  
  tooltip.style.display = 'block';
  tooltip.style.left = `${event.pageX + 10}px`;
  tooltip.style.top = `${event.pageY - 40}px`;
}

function hideTooltip() {
  const tooltip = document.querySelector('.chart-tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
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

  console.log('Updating team stats with:', stats);

  const totalWinsEl = document.querySelector('.wins-card .stat-value');
  const totalLossesEl = document.querySelector('.losses-card .stat-value');
  const avgKdaEl = document.querySelector('.kda-card .stat-value');
  const winrateEl = document.querySelector('.winrate-card .stat-value');

  console.log('Elements found:', { totalWinsEl, totalLossesEl, avgKdaEl, winrateEl });

  if (totalWinsEl) {
    totalWinsEl.textContent = stats.total_wins || 0;
    console.log('Updated wins to:', stats.total_wins);
  }
  if (totalLossesEl) {
    totalLossesEl.textContent = stats.total_losses || 0;
    console.log('Updated losses to:', stats.total_losses);
  }
  if (avgKdaEl) {
    avgKdaEl.textContent = (stats.average_kda || 0).toFixed(2);
    console.log('Updated KDA to:', (stats.average_kda || 0).toFixed(2));
  }
  if (winrateEl) {
    winrateEl.textContent = `${(stats.winrate || 0).toFixed(1)}%`;
    console.log('Updated winrate to:', `${(stats.winrate || 0).toFixed(1)}%`);
  }
}

function updateRoster(roster) {
  console.log('updateRoster called with:', roster);
  
  const rosterContainer = document.getElementById('rosterList');
  const rosterCount = document.getElementById('rosterCount');
  
  console.log('rosterContainer element:', rosterContainer);
  console.log('rosterCount element:', rosterCount);
  
  if (!rosterContainer) {
    console.error('rosterList element not found!');
    return;
  }

  // Update roster count
  if (rosterCount) {
    rosterCount.textContent = `${roster ? roster.length : 0} Players`;
  }

  if (!roster || roster.length === 0) {
    console.log('No roster data, showing empty message');
    rosterContainer.innerHTML = '<p class="no-data" style="padding: 2rem; text-align: center; color: var(--text-secondary);">No players in roster. Add players from the Players tab to get started.</p>';
    return;
  }

  console.log('Rendering', roster.length, 'players');
  rosterContainer.innerHTML = roster.map(player => {
    const kda = player.average_kda || 0;
    const winrate = player.winrate || 0;
    const winrateClass = winrate >= 50 ? 'success' : 'error';
    
    return `
      <div class="roster-player">
        <img src="${player.profile_picture || '../assets/default_pfp.png'}" alt="${player.name}" class="roster-avatar" />
        <div class="roster-player-info">
          <span class="roster-player-name">${player.name}</span>
          <div class="roster-player-role">
            <img src="../assets/${getRoleIcon(player.role)}" alt="${formatRole(player.role)}" class="roster-role-icon" />
            <span>${formatRole(player.role)}</span>
          </div>
        </div>
        <div class="roster-stats">
          <div class="roster-stat">
            <span class="stat-label-small">KDA</span>
            <span class="stat-value-small">${kda.toFixed(2)}</span>
          </div>
          <div class="roster-stat">
            <span class="stat-label-small">WR</span>
            <span class="stat-value-small ${winrateClass}">${winrate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
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
