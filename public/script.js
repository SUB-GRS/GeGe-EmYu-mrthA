let allEndpoints = [];

const video = document.getElementById('headerVideo');
if (video) {
    video.currentTime = 2;
    video.addEventListener('timeupdate', function() {
        if (this.currentTime > this.duration - 0.5) {
            this.currentTime = 2;
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
        console.error("Error:", e);
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
        
        const name = item.name || "Unknown API";
        const path = item.path || "/";
        const category = item.category || "General";

        card.innerHTML = `
            <div class="card-info">
                <h3>${name}</h3>
                <p>${path}</p>
            </div>
            <span class="cat-tag">${category}</span>
        `;
        grid.appendChild(card);
    });
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = allEndpoints.filter(item => 
        item.name.toLowerCase().includes(keyword) || 
        item.path.toLowerCase().includes(keyword)
    );
    renderCards(filtered);
});

loadDashboard();
