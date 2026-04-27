/**
 * app.js - Global Logic and API Fetching
 */

// Provide cross-origin URL routing if hosted directly via VSCode Live Server
const API_BASE = (window.location.port === '5500' || window.location.port.length === 4) 
    ? 'http://127.0.0.1:5000/api' 
    : '/api';

/**
 * Universal wrapper for API calls
 */
async function apiFetch(endpoint, options = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = localStorage.getItem('jwt_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: headers
        });
        
        if (!res.ok) {
            throw new Error(`API Error: ${res.status}`);
        }
        
        return await res.json();
    } catch (err) {
        console.error("apiFetch failed:", err);
        showToast(err.message, "error");
        return null;
    }
}

/**
 * Global Toast Notification
 */
function showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.className = `toast`;
    }, 3000);
}

/**
 * Navigation Selection State Sync
 */
function syncNavigation() {
    const pages = {
        'dashboard.html': 'nav-dashboard',
        'courses.html': 'nav-courses',
        'leaderboard.html': 'nav-leaderboard',
        'profile.html': 'nav-profile'
    };

    const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
    const activeId = pages[currentPath];

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    if (activeId) {
        const activeItem = document.getElementById(activeId);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    // Bind navigation logic to standard anchors if needed, 
    // but right now they are links. Let's make them actually navigate.
    document.getElementById('nav-dashboard')?.addEventListener('click', () => window.location.href = 'dashboard.html');
    document.getElementById('nav-courses')?.addEventListener('click', () => window.location.href = 'courses.html');
    document.getElementById('nav-leaderboard')?.addEventListener('click', () => window.location.href = 'leaderboard.html');
    document.getElementById('nav-profile')?.addEventListener('click', () => window.location.href = 'profile.html');
}

/**
 * Global User State Fetching (Mocked right now via dashboard API)
 * Populates Sidebar and Topbar universal elements.
 */
async function loadGlobalUserState() {
    const stats = await apiFetch('/analytics/dashboard');
    if (!stats) return;

    // Sidebar XP
    const sidebarXp = document.getElementById('sidebar-xp');
    const sidebarLevel = document.getElementById('sidebar-level');
    const sidebarTitle = document.getElementById('sidebar-level-title');
    const sidebarStreak = document.getElementById('sidebar-streak');
    
    if (sidebarXp) sidebarXp.textContent = stats.user.xp;
    if (sidebarLevel) sidebarLevel.textContent = stats.user.level;
    if (sidebarTitle) sidebarTitle.textContent = stats.user.level_title;
    if (sidebarStreak) sidebarStreak.textContent = stats.user.streak_days;

    // Topbar
    const topbarUsername = document.getElementById('topbar-username');
    if (topbarUsername) topbarUsername.textContent = stats.user.username;
}

document.addEventListener("DOMContentLoaded", () => {
    syncNavigation();
    loadGlobalUserState();

    // Hamburger Mobile Menu
    const hamburger = document.getElementById("hamburger-btn");
    const sidebar = document.getElementById("sidebar");
    
    if (hamburger && sidebar) {
        let overlay = document.createElement("div");
        overlay.className = "sidebar-overlay";
        document.body.appendChild(overlay);

        hamburger.addEventListener("click", () => {
            sidebar.classList.add("mobile-open");
            overlay.classList.add("visible");
        });

        overlay.addEventListener("click", () => {
            sidebar.classList.remove("mobile-open");
            overlay.classList.remove("visible");
        });

        // Close sidebar when nav item is clicked on mobile
        document.querySelectorAll(".nav-item").forEach(item => {
            item.addEventListener("click", () => {
                sidebar.classList.remove("mobile-open");
                overlay.classList.remove("visible");
            });
        });
    }
});
