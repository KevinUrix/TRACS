const { scrapeData } = require('../scraper/schedules');
const buildings = require('../config/buildings');
const fs = require('fs');
const path = require('path');

const saveAllToFiles = async (cycle, outputDirBase = '../data/buildings/') => {
  const outputDir = path.join(outputDirBase, cycle);

  // Verificar si la carpeta del ciclo existe, si no, se crea
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const building of buildings) {
    try {
      const data = await scrapeData(cycle, building);
      const filePath = path.join(outputDir, `${building}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`✅ Guardado: ${filePath} con ${data.length} entradas`);
    } catch (err) {
      console.error(`❌ Error al guardar datos del edificio ${building}:`, err.message);
    }
  }
};

module.exports = { saveAllToFiles };
