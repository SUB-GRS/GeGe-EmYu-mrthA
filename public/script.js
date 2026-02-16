const startBtn = document.getElementById('startBtn');
const landing = document.getElementById('landing-page');
const dashboard = document.getElementById('main-dashboard');
const curtain = document.getElementById('transition-curtain');

startBtn.addEventListener('click', () => {
    landing.classList.add('fade-out');
    curtain.classList.add('active');

    setTimeout(() => {
        landing.classList.add('hidden');
        dashboard.classList.remove('hidden');
        curtain.classList.add('slide-up');
        
        requestAnimationFrame(() => {
            dashboard.classList.add('show');
            fetchData();
        });
    }, 600);
});

async function fetchData() {
    const grid = document.getElementById('endpoint-grid');
    const countEl = document.getElementById('count');

    try {
        const res = await fetch('/api-stats');
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        
        const data = await res.json();
        
        // Cek jika data kosong dari backend lu
        if (!data || data.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:#64748b;">
                <p>Backend lu aktif, tapi gak ada route yang terdeteksi di folder /routes.</p>
            </div>`;
            countEl.innerText = "0";
            return;
        }

        countEl.innerText = data.length;
        grid.innerHTML = '';

        data.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'endpoint-card';
            card.onclick = () => window.open(item.path, '_blank');
            card.innerHTML = `
                <div class="card-left">
                    <div class="method-badge">${item.method || 'GET'}</div>
                    <div>
                        <h3>${item.name || 'Unknown API'}</h3>
                        <p>${item.path}</p>
                    </div>
                </div>
                <span class="cat-tag">${item.category || 'General'}</span>
            `;
            grid.appendChild(card);

            // Staggered appearance
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 + (index * 40));
        });

    } catch (e) {
        console.error("Dashboard Error:", e);
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#ef4444; padding:40px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:10px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <p><b>Server Connection Failed</b></p>
            <p style="font-size:0.8rem; opacity:0.8;">${e.message}</p>
        </div>`;
    }
}

// Menu & Search Logic
const menuBtn = document.getElementById('menuBtn');
const dropdown = document.getElementById('dropdownMenu');
if(menuBtn) {
    menuBtn.onclick = (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); };
    document.onclick = () => dropdown.classList.remove('show');
}

const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.endpoint-card').forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(term) ? 'flex' : 'none';
    });
});
