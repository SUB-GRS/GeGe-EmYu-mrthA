const startBtn = document.getElementById('startBtn');
const landing = document.getElementById('landing-page');
const dashboard = document.getElementById('main-dashboard');
const liquid = document.getElementById('liquid-layer');

startBtn.addEventListener('click', () => {
    // 1. Jalankan animasi air (Liquid)
    liquid.classList.add('active');
    
    // 2. Geser landing page ke kiri
    landing.style.transform = 'translateX(-100%)';

    setTimeout(() => {
        // 3. Tampilkan dashboard dan hilangkan landing dari DOM flow
        landing.classList.add('hidden');
        dashboard.classList.remove('hidden');
        
        // Trigger opacity fade in
        setTimeout(() => {
            dashboard.classList.add('show');
            loadDashboard(); // Load data API
        }, 50);
    }, 600); // Sinkron dengan durasi transisi CSS
});

// LOAD DATA API (Sesuai app.js lu)
async function loadDashboard() {
    try {
        const res = await fetch('/api-stats');
        const data = await res.json();
        const grid = document.getElementById('endpoint-grid');
        document.getElementById('count').innerText = data.length;
        grid.innerHTML = '';

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'endpoint-card';
            card.onclick = () => window.open(item.path, '_blank');
            card.innerHTML = `
                <div>
                    <h3 style="margin:0; font-size:1rem;">${item.name}</h3>
                    <p style="margin:4px 0 0; font-family:'JetBrains Mono'; font-size:0.75rem; color:#2563eb;">${item.path}</p>
                </div>
                <span class="cat-tag">${item.category}</span>
            `;
            grid.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

// TOGGLE MENU
const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
if(menuBtn) {
    menuBtn.onclick = (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    };
    document.onclick = () => dropdownMenu.classList.remove('show');