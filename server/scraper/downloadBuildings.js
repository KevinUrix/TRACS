const { scrapeData } = require('../scraper/schedules');

const buildingsData = require('../config/buildings');
const buildings = buildingsData.edifp;

const fs = require('fs');
const path = require('path');

const saveAllToFiles = async (cycle, outputDirBase = '../data/buildings/') => {
  const outputDir = path.join(outputDirBase, cycle);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const resultSummary = {
    success: [],
    failed: [],
    skipped: []
  };

  for (const building of buildings) {
    try {
      const data = await scrapeData(cycle, building);
      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`⚠️ Datos vacíos para ${building}`);
        resultSummary.skipped.push(building);
        continue;
      }

      const filePath = path.join(outputDir, `${building}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`✅ Guardado: ${filePath}`);
      resultSummary.success.push(building);
    } catch (err) {
      console.error(`❌ Error en ${building}:`, err.message);
      resultSummary.failed.push({ building, error: err.message });
    }
  }

  return resultSummary;
};



module.exports = { saveAllToFiles };
