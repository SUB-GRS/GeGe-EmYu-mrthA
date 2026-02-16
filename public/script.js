let allEndpoints = [];

const video = document.getElementById('headerVideo');

if (video) {
    video.currentTime = 2;

    video.addEventListener('timeupdate', function() {
        const buffer = 0.3;
        if (this.currentTime > this.duration - buffer) {
            this.currentTime = 5; 
            this.play();
        }
    });
}

async function loadDashboard() {
    try {
        const res = await fetch('/api-stats');
        allEndpoints = await res.json();
        renderCards(allEndpoints);
    } catch (e) {
        console.error("Dashboard Error:", e);
    }
}

function renderCards(data) {
    const grid = document.getElementById('endpoint-grid');
    document.getElementById('count').innerText = data.length;
    grid.innerHTML = '';

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'endpoint-card';
        card.onclick = () => window.open(item.path, '_blank');
        
        card.innerHTML = `
            <div class="card-header">
                <span class="badge-method">${item.method}</span>
                <span class="badge-output">${item.output || 'JSON'}</span>
            </div>
            <div>
                <h3>${item.name}</h3>
                <p>${item.path}</p>
            </div>
            <div class="card-footer">
                <span class="cat-label">${item.category}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary)"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </div>
        `;
        grid.appendChild(card);
    });
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = allEndpoints.filter(item => 
        item.name.toLowerCase().includes(keyword) || 
        item.path.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword)
    );
    renderCards(filtered);
});

loadDashboard();
