require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/lokasi", async (req, res) => {
  const kota = req.query.lokasi || "Bandung City";
  const apikey = process.env.MAPTILER_API_KEY;
  const baseUrl = process.env.MAPTILER_BASE_URL;

  const url = `${baseUrl}/${encodeURIComponent(kota)}.json?key=${apikey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;
    const feature = data.features[0];

    if (!feature) {
      return res.status(404).json({ message: "Lokasi tidak ditemukan" });
    }

    const [longitude, latitude] = feature.geometry.coordinates;
    const context = feature.context || [];
    const cariContext = (...jenis) =>
      context.find((item) => jenis.some((prefix) => item.id.startsWith(`${prefix}.`)))?.text;
    const negara = feature.properties.country || cariContext("country") || "Tidak diketahui";
    const provinsi = feature.properties.state || cariContext("region") || "Tidak diketahui";
    const kota = cariContext("county") || feature.text || feature.properties.name || kota;
    const kecamatan =
      feature.properties.district ||
      cariContext("district", "locality", "neighbourhood", "joint_municipality") ||
      (feature.id.startsWith("joint_municipality.") ? feature.text : undefined) ||
      "Tidak tersedia";

    res.json({
      kota,
      negara,
      provinsi,
      kecamatan,
      longitude,
      latitude,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Gagal mengambil data dari Maptiler" });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
