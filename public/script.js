const startBtn = document.getElementById('startBtn');
const landing = document.getElementById('landing-page');
const dashboard = document.getElementById('main-dashboard');
const curtain = document.getElementById('transition-curtain');

startBtn.addEventListener('click', () => {
    startBtn.style.pointerEvents = 'none';
    startBtn.style.opacity = '0.7';

    loadDashboardData();

    landing.classList.add('fade-out');
    curtain.classList.add('active');

    setTimeout(() => {
        landing.classList.add('hidden');
        dashboard.classList.remove('hidden');
        curtain.classList.add('slide-up');
        
        requestAnimationFrame(() => {
            dashboard.classList.add('show');
        });
    }, 600);
});

async function loadDashboardData() {
    try {
        const res = await fetch('/api-stats');
        
        if (!res.ok) {
            console.warn("Server Error detected (" + res.status + "). Using Mock Data.");
            renderGrid(MOCK_DATA);
            return;
        }

        const data = await res.json();
        renderGrid(data);

    } catch (e) {
        console.error("Fetch failed:", e);
        renderGrid(MOCK_DATA); 
    }
}

function renderGrid(data) {
    const grid = document.getElementById('endpoint-grid');
    const countEl = document.getElementById('count');
    
    let current = 0;
    const target = data.length;
    const interval = setInterval(() => {
        if(current >= target) clearInterval(interval);
        else { current++; countEl.innerText = current; }
    }, 50);

    grid.innerHTML = '';
    
    data.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'endpoint-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        card.onclick = () => window.open(item.path, '_blank');
        
        card.innerHTML = `
            <div>
                <h3>${item.name}</h3>
                <p>${item.path}</p>
            </div>
            <span class="cat-tag">${item.category || 'API'}</span>
        `;
        
        grid.appendChild(card);
        
        setTimeout(() => {
            card.style.transition = 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + (index * 50));
    });
}

const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.endpoint-card');
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(term) ? 'flex' : 'none';
    });
});

const menuBtn = document.getElementById('menuBtn');
const dropdown = document.getElementById('dropdownMenu');

menuBtn.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
};
document.onclick = () => dropdown.classList.remove('show');
