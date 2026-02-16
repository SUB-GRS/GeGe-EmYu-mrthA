const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

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

// [EDI FIX] Memastikan static file terbaca di Vercel
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Dashboard file not found.');
    }
});

const listEndpoints = [];

// Middleware Logger Telegram
app.use((req, res, next) => {
    if (req.path === '/' || req.path.includes('.') || req.path === '/api-stats') return next();

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
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            loadRoutes(fullPath, path.join(baseRoute, file));
        } else if (file.endsWith('.js')) {
            const route = require(fullPath);
            const routeName = file.split('.')[0];
            
            // Perbaikan Logika Kategori: Ambil nama folder induknya
            const categoryName = baseRoute ? baseRoute.split(path.sep).pop() : 'General';
            
            let relativePath = path.join(baseRoute, (routeName === 'index' ? '' : routeName)).replace(/\\/g, '/');
            let mountPath = `/${relativePath}`.replace(/\/+/g, '/');
            
            if (mountPath !== '/' && mountPath.endsWith('/')) {
                mountPath = mountPath.slice(0, -1);
            }

            app.use(mountPath, route);

            if (route.stack) {
                route.stack.forEach((s) => {
                    if (s.route) {
                        const subPath = s.route.path === '/' ? '' : s.route.path;
                        // [EDI FIX] Pastikan key 'category' dikirim ke dashboard
                        listEndpoints.push({
                            method: Object.keys(s.route.methods)[0].toUpperCase(),
                            category: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
                            path: `${mountPath}${subPath}`.replace(/\/+/g, '/')
                        });
                    }
                });
            }
            console.log(`[System] ${mountPath} loaded as ${categoryName}`);
        }
    });
}

if (fs.existsSync(routesPath)) {
    loadRoutes(routesPath);
}

app.get('/api-stats', (req, res) => {
    res.json(listEndpoints);
});

module.exports = app;

if (require.main === module) {
    app.listen(3000, () => console.log('Server active on port 3000'));
}
