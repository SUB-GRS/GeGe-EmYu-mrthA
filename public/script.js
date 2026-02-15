let allEndpoints = [];

async function loadDashboard() {
    try {
        const res = await fetch('/api-stats');
        allEndpoints = await res.json();
        
        renderTable(allEndpoints);
    } catch (e) {
        console.error("Dashboard Error:", e);
    }
}

function renderTable(data) {
    const list = document.getElementById('endpoint-list');
    document.getElementById('count').innerText = data.length;
    
    list.innerHTML = '';

    data.forEach(item => {
        const row = `
            <tr>
                <td><span class="badge ${item.method}">${item.method}</span></td>
                <td class="cat-name">${item.name}</td>
                <td><a href="${item.path}" target="_blank" class="url-link">${item.path}</a></td>
            </tr>
        `;
        list.innerHTML += row;
    });
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = allEndpoints.filter(item => 
        item.name.toLowerCase().includes(keyword) || 
        item.path.toLowerCase().includes(keyword)
    );
    renderTable(filtered);
});

loadDashboard();
