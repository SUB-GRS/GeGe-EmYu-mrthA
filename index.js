const express = require("express");
const chalk = require("chalk");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const axios = require("axios"); // Menggunakan axios untuk stabilitas
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// ========== TELEGRAM CONFIG ==========
// Masukkan di .env: TELEGRAM_BOT_TOKEN & TELEGRAM_OWNER_ID
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8503701861:AAH-CxH6lgiNqPI58EqeXuRQ9Le6TEgBjWI";
const OWNER_ID = process.env.TELEGRAM_OWNER_ID || "7925179886";

/**
 * Fungsi utama mengirim pesan ke Telegram
 */
async function sendTelegram(text) {
    if (!BOT_TOKEN || !OWNER_ID) return;
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: OWNER_ID,
            text: text,
            parse_mode: "HTML"
        });
    } catch (err) {
        console.error(chalk.red(`[TelegramError] ${err.response?.data?.description || err.message}`));
    }
}

// ========== KIRIM NOTIFIKASI SYSTEM ==========
async function sendNotification(msg) {
    const text = `<b>🚀 SYSTEM NOTIFICATION</b>\n\n${msg}\n\n📅 <code>${new Date().toLocaleString()}</code>`;
    await sendTelegram(text);
}

// ========== KIRIM LOG API ==========
async function sendLog({ ip, method, endpoint, status, query, duration }) {
    const icons = { request: "🟡", success: "✅", error: "❌" };
    
    // Format pesan log Telegram
    const text = `
${icons[status]} <b>API ACTIVITY - ${status.toUpperCase()}</b>
━━━━━━━━━━━━━━━━━━
👤 <b>IP:</b> <code>${ip}</code>
📡 <b>Method:</b> <code>${method}</code>
🛤️ <b>Endpoint:</b> <code>${endpoint}</code>
⏱️ <b>Duration:</b> <code>${duration ?? "-"}ms</code>
⌛ <b>Time:</b> <code>${new Date().toISOString()}</code>

🛠️ <b>Query:</b>
<pre>${JSON.stringify(query || {}, null, 2)}</pre>
━━━━━━━━━━━━━━━━━━
<i>Theresa API's Log System ✨</i>`;

    await sendTelegram(text);
}

// ========== EXPRESS CONFIG ==========
app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.set("json spaces", 2);

// ========== STATIC FILES ==========
app.use("/", express.static(path.join(__dirname, "api-page")));
app.use("/src", express.static(path.join(__dirname, "src")));

// ========== LOAD OPENAPI ==========
const openApiPath = path.join(__dirname, "./src/openapi.json");
let openApi = {};

try {
    if (fs.existsSync(openApiPath)) {
        openApi = JSON.parse(fs.readFileSync(openApiPath));
    }
} catch {
    console.warn(chalk.yellow("⚠️ openapi.json not found or invalid."));
}

// ========== ROUTE OPENAPI.JSON ==========
app.get("/openapi.json", (req, res) => {
    if (fs.existsSync(openApiPath)) res.sendFile(openApiPath);
    else res.status(404).json({ status: false, message: "openapi.json tidak ditemukan" });
});

// ========== MATCH PATH HELPER ==========
function matchOpenApiPath(requestPath) {
    const paths = Object.keys(openApi.paths || {});
    for (const apiPath of paths) {
        const regex = new RegExp("^" + apiPath.replace(/{[^}]+}/g, "[^/]+") + "$");
        if (regex.test(requestPath)) return true;
    }
    return false;
}

// ========== JSON WRAPPER ==========
app.use((req, res, next) => {
    const original = res.json;
    res.json = function (data) {
        if (typeof data === "object") {
            data = {
                status: data.status ?? true,
                creator: openApi.info?.author || "Rynn UI",
                ...data
            };
        }
        return original.call(this, data);
    };
    next();
});

// ========== ENDPOINT LOGGER MIDDLEWARE ==========
const endpointStats = {};

app.use(async (req, res, next) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const method = req.method;
    const endpoint = req.originalUrl.split("?")[0];
    const query = req.query;
    const start = Date.now();

    // Pastikan log hanya untuk endpoint yang terdaftar di OpenAPI
    const isApiEndpoint = matchOpenApiPath(endpoint);

    try {
        if (isApiEndpoint) {
            console.log(chalk.yellow(`🟡 [REQUEST] ${method} ${endpoint} | IP: ${ip}`));
            // Opsional: aktifkan baris di bawah jika ingin log saat request masuk
            // await sendLog({ ip, method, endpoint, status: "request", query });
        }

        next();

        res.on("finish", async () => {
            if (!isApiEndpoint) return;

            const duration = Date.now() - start;
            const isError = res.statusCode >= 400;
            const status = isError ? "error" : "success";

            // Update Statistics
            if (!endpointStats[endpoint]) {
                endpointStats[endpoint] = { total: 0, errors: 0, totalDuration: 0 };
            }
            endpointStats[endpoint].total++;
            endpointStats[endpoint].totalDuration += duration;
            if (isError) endpointStats[endpoint].errors++;

            const avg = (endpointStats[endpoint].totalDuration / endpointStats[endpoint].total).toFixed(2);

            // Kirim Log ke Telegram
            await sendLog({ ip, method, endpoint, status, query, duration });

            console.log(
                chalk[isError ? "red" : "green"](
                    `${isError ? "❌" : "✅"} [${status.toUpperCase()}] ${method} ${endpoint} | ${res.statusCode} | ${duration}ms (Avg: ${avg}ms)`
                )
            );
        });
    } catch (err) {
        console.error(chalk.red(`❌ Middleware Error: ${err.message}`));
        res.status(500).json({ status: false, message: "Internal middleware error" });
    }
});

// ========== LOAD API ROUTES DYNAMICALLY ==========
let totalRoutes = 0;
const apiFolder = path.join(__dirname, "./src/api");

if (fs.existsSync(apiFolder)) {
    const categories = fs.readdirSync(apiFolder);
    for (const sub of categories) {
        const subPath = path.join(apiFolder, sub);
        if (fs.statSync(subPath).isDirectory()) {
            const files = fs.readdirSync(subPath);
            for (const file of files) {
                if (file.endsWith(".js")) {
                    try {
                        const route = require(path.join(subPath, file));
                        if (typeof route === "function") {
                            route(app);
                            totalRoutes++;
                            console.log(chalk.bgYellow.black(`Loaded Route: ${file}`));
                        }
                    } catch (e) {
                        console.error(chalk.red(`Failed to load route ${file}: ${e.message}`));
                    }
                }
            }
        }
    }
}

// Kirim notifikasi saat server menyala
sendNotification(`Server started. Total Routes Loaded: ${totalRoutes}`);

// ========== MAIN ROUTES ==========
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "api-page", "index.html")));
app.get("/docs", (req, res) => res.sendFile(path.join(__dirname, "api-page", "docs.html")));

// 404 Handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "api-page", "404.html"));
});

// 500 Handler & Global Error Catcher
app.use((err, req, res, next) => {
    console.error(err.stack);
    sendNotification(`🚨 <b>SERVER ERROR DETECTED</b>\n\n<code>${err.message}</code>`);
    res.status(500).sendFile(path.join(__dirname, "api-page", "500.html"));
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(chalk.bgGreen.black(`Server running on port ${PORT}`));
});
