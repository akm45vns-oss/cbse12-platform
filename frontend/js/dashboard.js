/**
 * dashboard.js
 */

document.addEventListener("DOMContentLoaded", async () => {
    // Make sure apiFetch is available from app.js
    if (typeof apiFetch === 'undefined') return;

    const stats = await apiFetch('/analytics/dashboard');
    if (!stats) return; // if error happened, toast was already shown by app.js

    // Hydrate Page Welcome
    const dashUser = document.getElementById("dash-username");
    if (dashUser) dashUser.textContent = stats.user.username;

    // Hydrate Stats Grid
    document.getElementById("stat-xp-val").textContent = stats.user.xp;
    document.getElementById("stat-streak-val").textContent = stats.user.streak_days;
    document.getElementById("stat-accuracy-val").textContent = `${stats.metrics.accuracy_pct}%`;
    document.getElementById("stat-courses-val").textContent = stats.metrics.enrolled_courses;

    // Weak Topics
    const weakList = document.getElementById("weak-topics-list");
    if (weakList) {
        weakList.innerHTML = "";
        stats.weak_topics.forEach(topic => {
            const li = document.createElement("li");
            li.className = "weak-item";
            li.innerHTML = `
                <div class="weak-item-info">
                    <div class="weak-item-name">${topic.name}</div>
                    <div class="weak-item-course">${topic.course}</div>
                </div>
                <div class="weak-item-score">${topic.score}</div>
                <div class="weak-item-bar-wrap">
                    <div class="weak-item-bar" style="width: ${topic.score}"></div>
                </div>
            `;
            weakList.appendChild(li);
        });
    }

    // Recent Badges
    const badgesGrid = document.getElementById("dashboard-badges");
    if (badgesGrid) {
        badgesGrid.innerHTML = "";
        stats.recent_badges.forEach(badge => {
            const div = document.createElement("div");
            div.className = "badge-chip";
            div.title = badge.description;
            div.innerHTML = `<span class="badge-icon">${badge.icon}</span> ${badge.name}`;
            badgesGrid.appendChild(div);
        });
    }

    // Initialize Mock Charts
    initCharts();
});

function initCharts() {
    const xpCtx = document.getElementById('xp-line-chart')?.getContext('2d');
    if (xpCtx) {
        new Chart(xpCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'XP Earned',
                    data: [20, 45, 30, 80, 50, 90, 110],
                    borderColor: '#4f8ef7',
                    backgroundColor: 'rgba(79,142,247,0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
                    x: { grid: { display: false }, border: { display: false } }
                }
            }
        });
    }

    const accCtx = document.getElementById('accuracy-bar-chart')?.getContext('2d');
    if (accCtx) {
        new Chart(accCtx, {
            type: 'bar',
            data: {
                labels: ['Python', 'Networks', 'C++'],
                datasets: [{
                    label: 'Accuracy %',
                    data: [85, 62, 90],
                    backgroundColor: ['#4f8ef7', '#f43f5e', '#8b5cf6'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, max: 100 },
                    x: { grid: { display: false }, border: { display: false } }
                }
            }
        });
    }
}

