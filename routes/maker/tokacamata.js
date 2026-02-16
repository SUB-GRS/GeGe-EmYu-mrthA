const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');

function genserial() {
    let s = '';
    for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
}

async function upload(filename) {
    const form = new FormData();
    form.append('file_name', filename);
    const res = await axios.post('https://api.imgupscaler.ai/api/common/upload/upload-image', form, {
        headers: { 
            ...form.getHeaders(),
            'origin': 'https://imgupscaler.ai',
            'referer': 'https://imgupscaler.ai/'
        }
    });
    return res.data.result;
}

async function uploadtoOSS(putUrl, buffer, mime) {
    await axios.put(putUrl, buffer, { headers: { 'Content-Type': mime } });
    return true;
}

async function createJob(imageUrl, prompt) {
    const form = new FormData();
    form.append('model_name', 'magiceraser_v4');
    form.append('original_image_url', imageUrl);
    form.append('prompt', prompt); 
    form.append('ratio', 'match_input_image');
    form.append('output_format', 'jpg');

    const res = await axios.post('https://api.magiceraser.org/api/magiceraser/v2/image-editor/create-job', form, {
        headers: {
            ...form.getHeaders(),
            'product-code': 'magiceraser',
            'product-serial': genserial(),
            'origin': 'https://imgupscaler.ai',
            'referer': 'https://imgupscaler.ai/'
        }
    });
    return res.data;
}

async function cekjob(jobId) {
    const res = await axios.get(`https://api.magiceraser.org/api/magiceraser/v1/ai-remove/get-job/${jobId}`, {
        headers: { 'origin': 'https://imgupscaler.ai', 'referer': 'https://imgupscaler.ai/' }
    });
    return res.data;
}

router.get('/', async (req, res) => {
    const { url } = req.query;
    const fixedPrompt = `Anda adalah ahli visi komputer dan penata gaya virtual. 
Tugas: Analisis foto wajah yang diberikan.
Output harus mencakup:
1. Koordinat Bounding Box untuk area mata [ymin, xmin, ymax, xmax].
2. Bentuk wajah subjek (Oval/Bulat/Persegi/Hati).
3. Rekomendasi jenis frame kacamata yang paling cocok secara estetika.
4. Deskripsi posisi wajah (Menghadap depan/Menyamping).

Catatan: Berikan respons dalam format poin-poin yang jelas dan teknis.`; 

    if (!url) return res.status(400).set('Content-Type', 'text/plain').send("Error: url parameter required");

    try {
        const imageBuffer = await axios.get(url, { responseType: 'arraybuffer' });
        const mime = imageBuffer.headers['content-type'] || 'image/jpeg';
        
        const up = await upload(`edit_${Date.now()}.jpg`);
        await uploadtoOSS(up.url, Buffer.from(imageBuffer.data), mime);

        const targetUrl = 'https://cdn.imgupscaler.ai/' + up.object_name;
        const jobResponse = await createJob(targetUrl, fixedPrompt);

        if (jobResponse.code !== 0 && jobResponse.code !== 100000) {
            throw new Error(`API error: ${jobResponse.code}`);
        }

        const jobId = jobResponse.result.job_id;
        let result;
        let attempts = 0;

        while (attempts < 15) {
            await new Promise(r => setTimeout(r, 4000)); 
            result = await cekjob(jobId);
            if (result.result?.output_url && result.result.output_url.length > 0) break;
            if (result.code !== 300006 && result.code !== 100000 && result.code !== 0) throw new Error("Processing failed");
            attempts++;
        }

        if (!result.result?.output_url?.[0]) throw new Error("Result not found");

        const finalImage = await axios.get(result.result.output_url[0], { responseType: 'arraybuffer' });
        res.set('Content-Type', 'image/jpeg');
        return res.send(Buffer.from(finalImage.data));

    } catch (e) {
        res.status(500).set('Content-Type', 'text/plain').send(e.message);
    }
});

module.exports = router;
