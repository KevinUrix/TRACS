const { saveAllToFiles } = require('../scraper/downloadBuildings');

const getDownloads = async (req, res) => {
  console.log('Ruta /api/descargar-json alcanzada');
  try {
    const cycle = req.query.cycle;

    if (!cycle) {
      return res.status(400).json({ success: false, error: "Falta el parámetro 'cycle'" });
    }

    await saveAllToFiles(cycle);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getDownloads };
