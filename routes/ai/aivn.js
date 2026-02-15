const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const axios = require('axios');
const qs = require('qs');

async function copilotChat(message, model = 'default') {
    const models = {
        default: 'chat',
        'think-deeper': 'reasoning',
        'gpt-5': 'smart'
    };

    if (!models[model]) throw new Error(`Available models: ${Object.keys(models).join(', ')}`);

    const { data } = await axios.post('https://copilot.microsoft.com/c/api/conversations', null, {
        headers: {
            origin: 'https://copilot.microsoft.com',
            'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
        }
    });

    const conversationId = data.id;

    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`wss://copilot.microsoft.com/c/api/chat?api-version=2&features=-,ncedge,edgepagecontext&setflight=-,ncedge,edgepagecontext&ncedge=1`, {
            headers: {
                origin: 'https://copilot.microsoft.com',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });

        const response = { text: '' };

        ws.on('open', () => {
            ws.send(JSON.stringify({
                event: 'setOptions',
                supportedFeatures: ['partial-generated-images'],
                supportedCards: ['weather', 'local', 'image', 'sports', 'video', 'ads', 'safetyHelpline', 'quiz', 'finance', 'recipe'],
                ads: { supportedTypes: ['text', 'product', 'multimedia', 'tourActivity', 'propertyPromotion'] }
            }));

            ws.send(JSON.stringify({
                event: 'send',
                mode: models[model],
                conversationId,
                content: [{ type: 'text', text: message + ". Jawab maksimal 2 kalimat saja." }], // Rigor: Batasi panjang jawaban
                context: {}
            }));
        });

        ws.on('message', (chunk) => {
            try {
                const parsed = JSON.parse(chunk.toString());
                if (parsed.event === 'appendText') response.text += parsed.text || '';
                if (parsed.event === 'done') {
                    resolve(response.text);
                    ws.close();
                }
                if (parsed.event === 'error') {
                    reject(new Error(parsed.message));
                    ws.close();
                }
            } catch (error) {
                reject(error);
            }
        });

        ws.on('error', reject);
    });
}

// --- LOGIC WAVEL TTS ---
async function getAudioMP3(text) {
    const url = 'https://wavel.ai/wp-json/myplugin/v1/tts';
    const data = qs.stringify({
        lang: 'indonesian',
        text: text,
        voiceId: 'fr-FR-VivienneMultilingualNeural'
    });

    const response = await axios.post(url, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
    });
    
    let base64 = response.data.base64Audio;
    if (!base64) throw new Error("Wavel AI gagal konversi.");
    if (base64.includes(',')) base64 = base64.split(',')[1];
    return Buffer.from(base64, 'base64');
}

// --- ROUTER ENDPOINT ---
router.get('/', async (req, res) => {
    const { text, model } = req.query;

    if (!text) return res.status(400).json({ success: false, error: "Query ?text= wajib diisi." });

    try {
        console.log(`[Edi System] Copilot processing: ${text}`);

        // 1. Ambil jawaban teks dari Copilot
        const aiText = await copilotChat(text, model || 'default');
        console.log(`[Edi System] Copilot Reply: ${aiText}`);

        // 2. Convert teks Copilot ke MP3
        const audioBuffer = await getAudioMP3(aiText);

        // 3. Validasi & Kirim Biner
        if (audioBuffer.length < 500) throw new Error("Audio corrupt (buffer too small)");

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length
        });
        
        return res.send(audioBuffer);

    } catch (error) {
        console.error("[Edi Error]", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
