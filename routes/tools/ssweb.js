import axios from 'axios';

// Endpoint: /api/ssweb?url=https://google.com
app.get('/api/ssweb', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: 'Parameter URL diperlukan.' });
    }

    try {
        // 1. Ambil data dari Pikwy
        const response = await axios.get('https://api.pikwy.com/', {
            params: {
                tkn: 125,
                d: 3000,
                u: encodeURIComponent(targetUrl),
                fs: 0, w: 1280, h: 1200, s: 100, z: 100,
                f: 'jpg',
                rt: 'jweb'
            }
        });

        if (!response.data?.iurl) {
            throw new Error('Gagal mendapatkan link gambar dari Pikwy');
        }

        // 2. Ambil gambar asli dari iurl sebagai Stream/Buffer
        const imageRes = await axios({
            url: response.data.iurl,
            method: 'GET',
            responseType: 'stream'
        });

        // 3. Set header agar browser mengenali ini sebagai gambar JPG
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 jam agar hemat limit API

        // 4. Salurkan (pipe) data gambar ke client
        imageRes.data.pipe(res);

    } catch (error) {
        console.error('SSWeb Error:', error.message);
        res.status(500).json({ error: 'Gagal mengambil screenshot.' });
    }
});
