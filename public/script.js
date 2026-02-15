let allEndpoints = [];

async function loadDashboard() {
    try {
        const res = await fetch('/api-stats');
        if (!res.ok) throw new Error("Gagal mengambil data stats");
        
        allEndpoints = await res.json();
        renderTable(allEndpoints);
    } catch (e) {
        console.error("[Edi Dashboard Error]:", e);
        document.getElementById('endpoint-list').innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Gagal memuat data: ${e.message}</td></tr>`;
    }
}

function renderTable(data) {
    const list = document.getElementById('endpoint-list');
    const countDisplay = document.getElementById('count');
    
    if (countDisplay) countDisplay.innerText = data.length;
    
    list.innerHTML = data.map(item => {
        const category = item.category || "General";
        const methodClass = `badge-${item.method.toLowerCase()}`;
        
        return `
            <tr>
                <td><span class="badge ${methodClass}">${item.method}</span></td>
                <td class="cat-name">${category}</td>
                <td><a href="${item.path}" target="_blank" class="url-link">${item.path}</a></td>
            </tr>
        `;
    }).join('');
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    
    const filtered = allEndpoints.filter(item => {
        const category = (item.category || "").toLowerCase();
        const path = (item.path || "").toLowerCase();
        return category.includes(keyword) || path.includes(keyword);
    });
    
    renderTable(filtered);
});

loadDashboard();
