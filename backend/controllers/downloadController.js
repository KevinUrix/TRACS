const { saveAllToFiles } = require('../scraper/downloadBuildings');
const { saveCyclesToFile } = require('../scraper/downloadCycles');

const getDownloads = async (req, res) => {
  try {
    const cycle = req.query.cycle;

    if (!cycle) {
      return res.status(400).json({ success: false, error: "Falta el parámetro 'cycle'" });
    }

    const resultSummary = await saveAllToFiles(cycle);
    const cyclesSummary = await saveCyclesToFile();

    res.status(200).json({ success: true, result: {buildings: resultSummary, cycles: cyclesSummary} });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getDownloads };
