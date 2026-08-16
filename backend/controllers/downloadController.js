const { saveAllToFiles } = require('../scraper/downloadBuildings');
const { saveCyclesToFile } = require('../scraper/downloadCycles');

const validateCycle = (cycle) => {
  if (!cycle || typeof cycle !== 'string') return false;
  return /^[A-Z0-9]{3,8}$/.test(cycle.trim());
};

const getDownloads = async (req, res) => {
  try {
    const cycle = req.query.cycle;

    if (!cycle) {
      return res.status(400).json({ success: false, error: "Falta el parámetro 'cycle'" });
    }

    if (!validateCycle(cycle)) {
      return res.status(400).json({ success: false, error: 'Ciclo inválido' });
    }

    const resultSummary = await saveAllToFiles(cycle);
    const cyclesSummary = await saveCyclesToFile();

    res.status(200).json({ success: true, result: {buildings: resultSummary, cycles: cyclesSummary} });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getDownloads };
