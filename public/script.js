const startBtn = document.getElementById('startBtn');
const landing = document.getElementById('landing-page');
const dashboard = document.getElementById('main-dashboard');
const liquid = document.getElementById('liquid-layer');

// [EDI FIX] Pre-load data saat transisi dimulai agar tidak nunggu lama
startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    startBtn.style.opacity = '0.5';
    
    // Mulai ambil data SEKARANG, jangan nunggu animasi selesai
    loadDashboard();

    liquid.classList.add('active');
    
    setTimeout(() => {
        landing.classList.add('slide-out');
    }, 300);
    
    setTimeout(() => {
        landing.classList.add('hidden');
        dashboard.classList.remove('hidden');
        
        requestAnimationFrame(() => {
            setTimeout(() => {
                dashboard.classList.add('show');
            }, 50);
        });
    }, 800);
    
    setTimeout(() => {
        liquid.classList.add('active-out');
        // [EDI FIX] Matikan interaksi liquid agar tidak menghalangi klik
        liquid.style.pointerEvents = 'none';
    }, 1500);
});

async function loadDashboard() {
    try {
        const res = await fetch('/api-stats');
        if (!res.ok) throw new Error('Server respond error');
        const data = await res.json();
        
        const grid = document.getElementById('endpoint-grid');
        const countElement = document.getElementById('count');
        
        animateCount(countElement, 0, data.length, 800);
        
        grid.innerHTML = '';

        data.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'endpoint-card';
            // [EDI FIX] Set inline style untuk staggered animation
            card.style.cssText = `opacity: 0; transform: translateY(20px);`;
            
            card.onclick = () => window.open(item.path, '_blank');
            
            card.innerHTML = `
                <div>
                    <h3>${item.name}</h3>
                    <p>${item.path}</p>
                </div>
                <span class="cat-tag">${item.category}</span>
            `;
            
            grid.appendChild(card);
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 60); // Lebih cepat sedikit agar responsif
        });
    } catch (e) {
        console.error('Failed to load:', e);
        document.getElementById('count').innerText = 'Error';
    }
}

// Fungsi animateCount & Search tetap sama (sudah cukup oke)
function animateCount(element, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (end - start) * easeOutQuart);
        element.innerText = current;
        if (progress < 1) requestAnimationFrame(update);
        else element.innerText = end;
    }
    requestAnimationFrame(update);
}

// Dropdown & Search Logic
const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');

if (menuBtn) {
    menuBtn.onclick = (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    };
    document.onclick = () => dropdownMenu.classList.remove('show');
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.oninput = (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.endpoint-card').forEach(card => {
            const text = card.innerText.toLowerCase();
            card.style.display = text.includes(term) ? 'flex' : 'none';
        });
    };
}
