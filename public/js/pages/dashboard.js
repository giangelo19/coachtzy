// Dashboard page functionality
import { requireAuth, getCurrentUser } from '../auth.js';
import { dashboardAPI } from '../api/dashboard.js';
import { matchesAPI } from '../api/matches.js';

// Protect this page - redirect to login if not authenticated
await requireAuth();

async function initDashboard() {
  try {
    console.log('🚀 Dashboard initialization starting...');
    
    // Get current user info
    const user = await getCurrentUser();
    updateUserProfile(user);

    // Load dashboard data
    await loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Dashboard initialization complete');
  } catch (error) {
    console.error('❌ Dashboard initialization error:', error);
  }
}

// Run immediately if DOM is ready, otherwise wait for it
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}

async function loadDashboardData() {
  try {
    // Show loading state
    showLoading();

    // Calculate winrate from actual matches
    await updateWinrateCard();
    
    // Update recent match card
    await updateRecentMatchCard();
    
    // Update weekly performance chart
    await updateWeeklyPerformanceChart();
    
    // Note: Other dashboard features can be added later
    // const dashboardData = await dashboardAPI.getDashboardData(teamId);
    // const recentMatches = await matchesAPI.getRecent(5);
    // updateTeamStats(dashboardData.teamStats);
    // updatePlayerCards(dashboardData.topPlayers);
    // updateRecentMatches(recentMatches);
    // updateWeeklyPerformance(dashboardData.weeklyPerformance);

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

async function updateWinrateCard() {
  try {
    // Import matches API - using default import
    const matchesModule = await import('../api/matches.js');
    const matchesAPI = matchesModule.matchesAPI;
    
    console.log('🔍 Fetching all matches...');
    
    // Get all matches for the team
    const allMatches = await matchesAPI.getAll();
    
    console.log('📦 Total matches fetched:', allMatches.length);
    
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log('📅 Filtering matches from last 30 days (after:', thirtyDaysAgo.toISOString().split('T')[0], ')');
    
    // Filter matches from last 30 days
    const recentMatches = allMatches.filter(match => {
      const matchDate = new Date(match.match_date || match.date);
      return matchDate >= thirtyDaysAgo;
    });
    
    console.log('📋 Matches in last 30 days:', recentMatches.length);
    console.log('📋 Recent matches:', recentMatches);
    
    // Calculate wins and losses from last 30 days
    const wins = recentMatches.filter(match => match.result === 'win' || match.result === 'victory').length;
    const losses = recentMatches.filter(match => match.result === 'loss' || match.result === 'defeat').length;
    const totalMatches = wins + losses;
    const winrate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    console.log('📊 Winrate calculation (Last 30 Days):', { wins, losses, totalMatches, winrate: `${winrate.toFixed(1)}%` });

    // Update winrate percentage
    const winratePercentageEl = document.querySelector('.winrate-percentage');
    if (winratePercentageEl) {
      winratePercentageEl.textContent = `${winrate.toFixed(0)}%`;
      console.log('✅ Updated winrate percentage');
    }

    // Update wins and losses count
    const winsValueEl = document.querySelector('.stat-item.wins .stat-value');
    const lossesValueEl = document.querySelector('.stat-item.losses .stat-value');
    
    if (winsValueEl) {
      winsValueEl.textContent = wins;
      console.log('✅ Updated wins count');
    }
    if (lossesValueEl) {
      lossesValueEl.textContent = losses;
      console.log('✅ Updated losses count');
    }

    // Update donut chart arcs
    if (totalMatches > 0) {
      const circumference = 2 * Math.PI * 80; // radius = 80
      const winArcLength = (wins / totalMatches) * circumference;
      const lossArcLength = (losses / totalMatches) * circumference;

      const winArc = document.querySelector('.win-arc');
      const lossArc = document.querySelector('.loss-arc');

      if (winArc) {
        winArc.setAttribute('stroke-dasharray', `${winArcLength} ${circumference}`);
        console.log('✅ Updated win arc');
      }

      if (lossArc) {
        lossArc.setAttribute('stroke-dasharray', `${lossArcLength} ${circumference}`);
        lossArc.setAttribute('stroke-dashoffset', -winArcLength);
        console.log('✅ Updated loss arc');
      }
    } else {
      console.log('⚠️ No matches found in last 30 days, keeping default values');
    }
  } catch (error) {
    console.error('❌ Error updating winrate card:', error);
  }
}

async function updateRecentMatchCard() {
  try {
    console.log('🎮 Fetching recent match...');
    
    // Get all matches
    const allMatches = await matchesAPI.getAll();
    
    if (allMatches.length === 0) {
      console.log('⚠️ No matches found');
      return;
    }
    
    // Sort by date and get the most recent
    const sortedMatches = allMatches.sort((a, b) => {
      const dateA = new Date(a.match_date || a.date);
      const dateB = new Date(b.match_date || b.date);
      return dateB - dateA;
    });
    
    const recentMatch = sortedMatches[0];
    console.log('📋 Most recent match:', recentMatch);
    
    // Update result badge
    const resultBadge = document.querySelector('.recent-match-card .result-badge');
    const isWin = recentMatch.result === 'win' || recentMatch.result === 'victory';
    
    if (resultBadge) {
      resultBadge.className = `result-badge ${isWin ? 'win-badge' : 'loss-badge'}`;
      resultBadge.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          ${isWin 
            ? '<polyline points="20 6 9 17 4 12"></polyline>' 
            : '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'}
        </svg>
        ${isWin ? 'Victory' : 'Defeat'}
      `;
    }
    
    // Update opponent name
    const opponentNameEl = document.querySelector('.recent-match-card .team-side.away .team-name');
    if (opponentNameEl) {
      opponentNameEl.textContent = recentMatch.opponent_name || 'Unknown Opponent';
      console.log('✅ Updated opponent name:', recentMatch.opponent_name);
    }
    
    // Update scores
    const homeScoreEl = document.querySelector('.recent-match-card .team-side.home .team-score');
    const awayScoreEl = document.querySelector('.recent-match-card .team-side.away .team-score');
    
    if (homeScoreEl && awayScoreEl) {
      homeScoreEl.textContent = recentMatch.score_team || '0';
      awayScoreEl.textContent = recentMatch.score_opponent || '0';
      
      // Add winner class to winning score
      homeScoreEl.className = 'team-score' + (isWin ? ' winner' : '');
      awayScoreEl.className = 'team-score' + (!isWin ? ' winner' : '');
      
      console.log('✅ Updated scores:', recentMatch.score_team, '-', recentMatch.score_opponent);
    }
    
    // Update date
    const matchDate = new Date(recentMatch.match_date || recentMatch.date);
    const dateEl = document.querySelector('.recent-match-card .meta-item:first-child span');
    if (dateEl) {
      dateEl.textContent = matchDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
    // Update match type
    const matchTypeEl = document.querySelector('.recent-match-card .meta-item:last-child span');
    if (matchTypeEl) {
      matchTypeEl.textContent = recentMatch.match_type || 'Match';
    }
    
    console.log('✅ Recent match card updated');
  } catch (error) {
    console.error('❌ Error updating recent match card:', error);
  }
}

async function updateWeeklyPerformanceChart() {
  try {
    console.log('📊 Calculating weekly performance...');
    
    // Get all matches
    const allMatches = await matchesAPI.getAll();
    
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
    allMatches.forEach(match => {
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
    
    console.log('📈 Weekly data:', last7Days);
    
    // Update chart labels (x-axis dates)
    const labels = document.querySelectorAll('.chart-x-labels-new span');
    last7Days.forEach((day, index) => {
      if (labels[index]) {
        labels[index].textContent = day.displayDate;
      }
    });
    
    // Update "This Week" metric (average KDA only from days with matches)
    const daysWithMatches = last7Days.filter(day => day.matches.length > 0);
    const totalKDA = daysWithMatches.reduce((sum, day) => sum + day.avgKDA, 0);
    const avgKDA = daysWithMatches.length > 0 ? totalKDA / daysWithMatches.length : 0;
    
    const thisWeekValueEl = document.querySelector('.performance-metric .metric-value');
    if (thisWeekValueEl) {
      thisWeekValueEl.textContent = avgKDA.toFixed(1);
      console.log('📊 This Week Average KDA:', avgKDA.toFixed(1), `(from ${daysWithMatches.length} days with matches)`);
    }
    
    // Update the SVG path with actual data
    const svg = document.querySelector('.line-chart-new');
    if (!svg) {
      console.log('⚠️ SVG chart not found');
      return;
    }
    
    // Calculate points for the line chart
    const chartWidth = 700;
    const chartHeight = 200;
    const maxKDA = Math.max(...last7Days.map(d => d.avgKDA), 10); // Min scale of 10
    const minKDA = 0;
    
    // Calculate point positions
    const pointsData = last7Days.map((day, index) => {
      const x = (index / (last7Days.length - 1)) * chartWidth;
      const ratio = day.avgKDA / maxKDA;
      const y = chartHeight - (ratio * chartHeight * 0.8); // Use 80% of height for data
      return { x, y, kda: day.avgKDA };
    });
    
    // Update polyline (the line)
    const polyline = svg.querySelector('polyline');
    if (polyline) {
      const points = pointsData.map(p => `${p.x},${p.y}`).join(' ');
      polyline.setAttribute('points', points);
    }
    
    // Update polygon (area fill)
    const polygon = svg.querySelector('polygon');
    if (polygon) {
      const points = [
        `0,${chartHeight}`,
        ...pointsData.map(p => `${p.x},${p.y}`),
        `${chartWidth},${chartHeight}`
      ].join(' ');
      polygon.setAttribute('points', points);
    }
    
    // Update circles (data points)
    const circles = svg.querySelectorAll('circle');
    pointsData.forEach((point, index) => {
      if (circles[index]) {
        // Align circles to exact x positions (evenly spaced across chart width)
        const exactX = (index / (last7Days.length - 1)) * chartWidth;
        circles[index].setAttribute('cx', exactX);
        circles[index].setAttribute('cy', point.y);
        
        // Hide circle if KDA is zero (no matches on that day)
        if (point.kda === 0 || point.y >= chartHeight) {
          circles[index].setAttribute('opacity', '0');
          circles[index].style.visibility = 'hidden';
        } else {
          circles[index].setAttribute('opacity', '1');
          circles[index].style.visibility = 'visible';
        }
      }
    });
    
    console.log('✅ Weekly performance chart updated');
  } catch (error) {
    console.error('❌ Error updating weekly performance chart:', error);
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
