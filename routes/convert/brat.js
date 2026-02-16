const express = require("express");
const router = express.Router();
const axios = require("axios");

async function generateBrat(text) {
  try {
    const response = await axios.get(`https://aqul-brat.hf.space/api/brat?text=${encodeURIComponent(text)}`, {
      responseType: 'arraybuffer', 
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      },
      timeout: 15000
    });

    if (!response.data) throw new Error("Gagal mengambil gambar dari API");

    return response.data;
  } catch (error) {
    throw new Error(error.message || "Gagal proses Brat");
  }
}

router.get("/", async (req, res) => {
  const { text } = req.query;

  if (!text) {
    return res.status(400).json({ 
      status: false, 
      error: "Parameter 'text' wajib diisi." 
    });
  }

  try {
    const imageBuffer = await generateBrat(text);

    res.set('Content-Type', 'image/png');
    res.status(200).send(imageBuffer);

  } catch (err) {
    res.status(500).json({ 
      status: false, 
      error: err.message 
    });
  }
});

module.exports = router;
