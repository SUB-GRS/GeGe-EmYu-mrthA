const express = require("express");
const router = express.Router();
const axios = require("axios");

async function tiktokTikWM(url) {
  try {
    const params = new URLSearchParams();
    params.set("url", url);
    params.set("hd", "1");

    const response = await axios.post("https://tikwm.com/api/", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
        Cookie: "current_language=en",
      },
    });

    if (!response.data || !response.data.data) {
        throw new Error("Data tidak ditemukan atau URL tidak valid.");
    }

    return response.data.data;
  } catch (error) {
    throw new Error(error.message || "Gagal mengambil data TikTok");
  }
}

router.get("/", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ 
        status: false, 
        error: "Parameter 'url' wajib diisi." 
    });
  }

  try {
    const result = await tiktokTikWM(url);
    res.status(200).json({
      status: true,
      result,
    });
  } catch (err) {
    res.status(500).json({ 
        status: false, 
        error: err.message 
    });
  }
});

module.exports = router;
