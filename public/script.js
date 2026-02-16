const startBtn = document.getElementById('startBtn');
const landing = document.getElementById('landing-page');
const dashboard = document.getElementById('main-dashboard');
const liquid = document.getElementById('liquid-layer');

// Smooth transition to dashboard
startBtn.addEventListener('click', () => {
    // Disable button to prevent multiple clicks
    startBtn.disabled = true;
    startBtn.style.opacity = '0.7';
    
    // Step 1: Activate liquid layer
    liquid.classList.add('active');
    
    // Step 2: Slide out landing page
    setTimeout(() => {
        landing.classList.add('slide-out');
    }, 300);
    
    // Step 3: Show dashboard with smooth transition
    setTimeout(() => {
        landing.classList.add('hidden');
        dashboard.classList.remove('hidden');
        
        // Small delay before showing dashboard content
        requestAnimationFrame(() => {
            setTimeout(() => {
                dashboard.classList.add('show');
                loadDashboard();
            }, 50);
        });
    }, 800);
    
    // Step 4: Complete liquid animation
    setTimeout(() => {
        liquid.classList.add('active-out');
    }, 1500);
});

// Load API data
async function loadDashboard() {
    try {
        const res = await fetch('/api-stats');
        const data = await res.json();
        const grid = document.getElementById('endpoint-grid');
        const countElement = document.getElementById('count');
        
        // Animate count
        animateCount(countElement, 0, data.length, 800);
        
        grid.innerHTML = '';

        // Add cards with staggered animation
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
                <span class="cat-tag">${item.category}</span>
            `;
            
            grid.appendChild(card);
            
            // Staggered fade-in animation
            setTimeout(() => {
                card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 80);
        });
    } catch (e) {
        console.error('Failed to load endpoints:', e);
        document.getElementById('count').innerText = '0';
    }
}

// Animate number counting
function animateCount(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (end - start) * easeOutQuart);
        
        element.innerText = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.innerText = end;
        }
    }
    
    requestAnimationFrame(update);
}

// Menu dropdown functionality
const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');

if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdownMenu.contains(e.target) && !menuBtn.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
}

// Search functionality
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.endpoint-card');
        
        cards.forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const path = card.querySelector('p').textContent.toLowerCase();
            const category = card.querySelector('.cat-tag').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || path.includes(searchTerm) || category.includes(searchTerm)) {
                card.style.display = 'flex';
                card.style.animation = 'fadeIn 0.3s ease-out';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Add CSS for fadeIn animation dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);

// Smooth scroll behavior
document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.style.scrollBehavior = 'smooth';
});
