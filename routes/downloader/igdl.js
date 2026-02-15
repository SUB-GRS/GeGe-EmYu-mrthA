const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * Core Logic: Instagram Downloader via SaveFrom Engine
 * Metode ini lebih tahan banting terhadap perubahan DOM.
 */
async function igdl(url) {
    try {
        // Step 1: Request ke worker savefrom
        const response = await axios.post('https://worker.sf-api.com/savefrom.php', 
            new URLSearchParams({
                'url': url,
                'lang': 'id',
                'app': '189',
                'videoid': ''
            }).toString(), 
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': 'https://id.savefrom.net',
                    'Referer': 'https://id.savefrom.net/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                }
            }
        );

        // Parsing hasil dari script string (SaveFrom return data dlm bentuk executable JS string)
        const dataText = response.data;
        
        // Ekstraksi data menggunakan Regex karena response bukan JSON murni
        const jsonMatch = dataText.match(/sd:\s*({.*}),\s*hd:/);
        if (!jsonMatch) throw new Error("Gagal mengekstrak data media. Link mungkin private.");

        const mediaData = JSON.parse(jsonMatch[1]);

        return {
            type: mediaData.url[0].type || 'mp4',
            title: mediaData.meta.title,
            duration: mediaData.meta.duration,
            thumbnail: mediaData.thumb,
            links: mediaData.url.map(v => ({
                url: v.url,
                quality: v.subname,
                ext: v.ext
            }))
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

/**
 * Route Handler
 */
router.get('/', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'url' wajib diisi."
        });
    }

    try {
        const result = await igdl(url);
        res.json({
            status: 200,
            success: true,
            creator: "Dyzen",
            results: result
        });
    } catch (e) {
        res.status(500).json({
            status: false,
            error: "Scraper Error: " + e.message
        });
    }
});

module.exports = router;
