// Draft Simulator - Load heroes from database
import { supabase } from '../supabase-client.js';
import { heroesAPI } from '../api/heroes.js';

let allHeroes = [];
let filteredHeroes = [];
let bannedHeroes = new Set();
let pickedHeroes = new Set();
let currentFilter = 'all';

// Check authentication
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Load all heroes from database
async function loadHeroes() {
    try {
        console.log('Loading heroes from database...');
        const heroes = await heroesAPI.getAll();
        allHeroes = heroes || [];
        filteredHeroes = [...allHeroes];
        console.log(`Loaded ${allHeroes.length} heroes`);
        displayHeroes();
    } catch (error) {
        console.error('Error loading heroes:', error);
        showError('Failed to load heroes. Please refresh the page.');
    }
}

// Display heroes in the grid
function displayHeroes() {
    const container = document.getElementById('heroGridContainer');
    if (!container) {
        console.error('Hero grid container not found');
        return;
    }

    if (filteredHeroes.length === 0) {
        container.innerHTML = '<div class="no-heroes">No heroes found</div>';
        return;
    }

    container.innerHTML = filteredHeroes.map(hero => createHeroCard(hero)).join('');
    
    // Add click listeners
    container.querySelectorAll('.hero-slot').forEach(slot => {
        slot.addEventListener('click', () => handleHeroClick(slot.dataset.heroId));
    });
}

// Create hero card HTML
function createHeroCard(hero) {
    const isUnavailable = bannedHeroes.has(hero.id) || pickedHeroes.has(hero.id);
    const availableClass = isUnavailable ? 'unavailable' : 'available';
    const iconSrc = hero.icon || '/assets/placeholder.jpg';
    
    return `
        <div class="hero-slot ${availableClass}" data-hero-id="${hero.id}" data-hero-name="${hero.name}">
            <img src="${iconSrc}" alt="${hero.name}" onerror="this.src='/assets/placeholder.jpg'" />
            <div class="hero-name">${hero.name}</div>
            <div class="hero-roles">
                <span class="role-badge role-${hero.role1}">${capitalize(hero.role1)}</span>
                ${hero.role2 ? `<span class="role-badge role-${hero.role2}">${capitalize(hero.role2)}</span>` : ''}
            </div>
            ${isUnavailable ? '<div class="unavailable-overlay"><span class="x-mark">✕</span></div>' : ''}
        </div>
    `;
}

// Handle hero click
function handleHeroClick(heroId) {
    const hero = allHeroes.find(h => h.id === heroId);
    if (!hero) return;
    
    console.log('Selected hero:', hero.name);
    // Future: Add to pick/ban slots
}

// Filter heroes by role
function filterHeroes(role) {
    currentFilter = role;
    
    if (role === 'all') {
        filteredHeroes = [...allHeroes];
    } else {
        filteredHeroes = allHeroes.filter(hero => 
            hero.role1 === role || hero.role2 === role
        );
    }
    
    displayHeroes();
}

// Search heroes by name
function searchHeroes(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
        filteredHeroes = currentFilter === 'all' 
            ? [...allHeroes]
            : allHeroes.filter(hero => hero.role1 === currentFilter || hero.role2 === currentFilter);
    } else {
        const baseFiltered = currentFilter === 'all' 
            ? allHeroes
            : allHeroes.filter(hero => hero.role1 === currentFilter || hero.role2 === currentFilter);
            
        filteredHeroes = baseFiltered.filter(hero =>
            hero.name.toLowerCase().includes(term)
        );
    }
    
    displayHeroes();
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.querySelector('.hero-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => searchHeroes(e.target.value));
    }
    
    // Role filter buttons
    const roleButtons = document.querySelectorAll('.role-filter-btn');
    roleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            roleButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Filter heroes
            const role = btn.dataset.role;
            filterHeroes(role);
        });
    });
}

// Helper function to capitalize first letter
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Show error message
function showError(message) {
    const container = document.getElementById('heroGridContainer');
    if (container) {
        container.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

// Initialize page
async function init() {
    console.log('Draft simulator initializing...');
    
    // Check authentication
    const authenticated = await checkAuth();
    if (!authenticated) return;
    
    // Load heroes from database
    await loadHeroes();
    
    // Setup event listeners
    setupEventListeners();
}

// Start when DOM is ready
init();
