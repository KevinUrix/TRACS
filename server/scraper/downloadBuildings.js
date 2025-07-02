const { scrapeData } = require('./schedules');

const buildingsData = require('../config/buildings');
const buildings = buildingsData.edifp;

const fs = require('fs');
const path = require('path');
const http = require('http');

const isSiiauAvailable = () => {
  return new Promise((resolve, reject) => {
    http.get('http://consulta.siiau.udg.mx/wco/sspseca.forma_consulta', (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        reject(new Error(`SIIAU no disponible. Status: ${res.statusCode}`));
      }
    }).on('error', (err) => {
      reject(new Error(`Error al conectar a SIIAU: ${err.message}`));
    });
  });
};


const saveAllToFiles = async (cycle, outputDirBase = path.join(__dirname, '../data/buildings/')) => {
  try {
    await isSiiauAvailable(); // Valida si SIIAU funciona

    const outputDir = path.join(outputDirBase, cycle);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const resultSummary = {
      success: [],
      failed: [],
      skipped: [],
      empty: []
    };

    for (const building of buildings) {
      try {
        const data = await scrapeData(cycle, building.value, true);

        if (data && typeof data === 'object' && data.error) {
          console.warn(`⚠️ Error explícito para ${building.value}`);
          resultSummary.failed.push(building.value);
          continue;
        }

        let actualData = [];

        if (Array.isArray(data)) {
          // Retorna plano directamente como array
          actualData = data;
        } else if (Array.isArray(data?.data)) {
          // Retorna como objeto con propiedad 'data'
          actualData = data.data;
        }

        // Verificar si hay datos útiles
        if (!Array.isArray(actualData)) {
          console.warn(`⚠️ Datos corruptos para ${building.value}`);
          resultSummary.skipped.push(building.value);
          continue;
        }
        else if (actualData.length === 0) {
          console.warn(`⚠️ Datos vacíos para ${building.value}`);
          resultSummary.empty.push(building.value);
        }

        const filePath = path.join(outputDir, `${building.value}.json`);
        fs.writeFileSync(filePath, JSON.stringify(actualData, null, 2), 'utf-8');
        console.log(`✅ Guardado: ${filePath}`);
        resultSummary.success.push(building.value);
      } catch (err) {
        console.error(`❌ Error en ${building.value}:`, err.message);
        resultSummary.failed.push({ building, error: err.message });
      }
    }

    return resultSummary;
  }

  catch (err) {
    console.error(`⛔ No se puede iniciar scraping: ${err.message}`);
    return {
      success: [],
      failed: buildings.map(b => b.value),
      skipped: [],
      empty: []
    }
  };
}


module.exports = { saveAllToFiles };
