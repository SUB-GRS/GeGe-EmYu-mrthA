const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios'); // Pastikan axios ada di package.json

const app = express();

const TELEGRAM_TOKEN = '8503701861:AAH-CxH6lgiNqPI58EqeXuRQ9Le6TEgBjWI';
const OWNER_ID = '7925179886';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        status: false,
        message: "Too many requests, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.json());

// [EDI FIX 1] Gunakan Absolute Path untuk Public Folder
app.use(express.static(path.join(__dirname, 'public')));

// [EDI FIX 2] Explicit Root Route Handler
// Ini memaksa Express mengirimkan index.html saat user membuka domain utama
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Error: Public/index.html not found. Check your deployment.');
    }
});

const listEndpoints = [];

// Middleware Logger Telegram
app.use((req, res, next) => {
    // Skip logging untuk file statis (css/js/html) agar bot tidak spam
    if (req.path === '/' || req.path.includes('.')) return next();

    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, url, ip } = req;
        const statusCode = res.statusCode;
        const statusEmoji = statusCode >= 200 && statusCode < 300 ? '✅' : '❌';

        const message = `
${statusEmoji} *NEW API INTERACTION*
━━━━━━━━━━━━━━━━━━
📝 *Detail Request*
• *Method:* \`${method}\`
• *Path:* \`${url}\`
• *Status:* \`${statusCode}\`
• *Speed:* \`${duration}ms\`

👤 *Client Info*
• *IP Address:* \`${ip}\`
• *Time:* \`${new Date().toLocaleString('id-ID')}\`
━━━━━━━━━━━━━━━━━━`.trim();

        axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: OWNER_ID,
            text: message,
            parse_mode: 'Markdown'
        }).catch(() => {});
    });
    next();
});

const routesPath = path.join(__dirname, 'routes');

function loadRoutes(dir, baseRoute = '') {
    // Cek apakah folder routes ada sebelum readdir (Mencegah crash jika folder hilang saat deploy)
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            loadRoutes(fullPath, path.join(baseRoute, file));
        } else if (file.endsWith('.js')) {
            const route = require(fullPath);
            const routeName = file.split('.')[0];
            
            // Logika path cleaning
            let relativePath = path.join(baseRoute, (routeName === 'index' ? '' : routeName)).replace(/\\/g, '/');
            let mountPath = `/${relativePath}`.replace(/\/+/g, '/');
            
            // Hapus trailing slash jika ada (kecuali root)
            if (mountPath !== '/' && mountPath.endsWith('/')) {
                mountPath = mountPath.slice(0, -1);
            }

            app.use(mountPath, route);

            // Logic pencatat endpoint untuk /api-stats
            if (route.stack) {
                route.stack.forEach((s) => {
                    if (s.route) {
                        const subPath = s.route.path === '/' ? '' : s.route.path;
                        listEndpoints.push({
                            category: routeName, // Menambahkan kategori untuk dashboard
                            path: `${mountPath}${subPath}`.replace(/\/+/g, '/'),
                            method: Object.keys(s.route.methods)[0].toUpperCase()
                        });
                    }
                });
            }
            console.log(`[System] ${mountPath} loaded`);
        }
    });
}

// Jalankan loadRoutes hanya jika folder routes ada
if (fs.existsSync(routesPath)) {
    loadRoutes(routesPath);
}

app.get('/api-stats', (req, res) => {
    res.json(listEndpoints);
});

// Penting untuk Vercel: Export app
module.exports = app;

// Listener lokal (Vercel tidak butuh ini sebenarnya, tapi biarkan untuk test lokal)
if (require.main === module) {
    app.listen(3000, () => console.log('Server active on port 3000'));
}
