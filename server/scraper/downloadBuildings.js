const { scrapeData } = require('./schedules');

const buildingsData = require('../config/buildings');
const buildings = buildingsData.edifp;

const fs = require('fs');
const path = require('path');

const saveAllToFiles = async (cycle, outputDirBase = path.join(__dirname, '../data/buildings/')) => {
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
      const data = await scrapeData(cycle, building.value);
      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`⚠️ Datos vacíos para ${building.value}`);
        resultSummary.skipped.push(building.value);
        continue;
      }

      const filePath = path.join(outputDir, `${building.value}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`✅ Guardado: ${filePath}`);
      resultSummary.success.push(building.value);
    } catch (err) {
      console.error(`❌ Error en ${building.value}:`, err.message);
      resultSummary.failed.push({ building, error: err.message });
    }
  }

  return resultSummary;
};



module.exports = { saveAllToFiles };
