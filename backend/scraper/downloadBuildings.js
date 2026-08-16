const { scrapeData } = require('./schedules');
const fs = require('fs');
const path = require('path');
const https = require('https');
// const http = require('http'); // QUITEN LOS COMENTARIOS SI SE USA HTTP EN LUGAR DE HTTPS

const getBuildings = () => {
  const filePath = path.join(__dirname, '../config/buildings.json');
  const json = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(json).edifp;
};

const isSiiauAvailable = () => {
  return new Promise((resolve, reject) => {
    https.get('https://siiauescolar.siiau.udg.mx/wal/sspseca.forma_consulta', (res) => {
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

    console.log(`Descargando el paquete masivo para el ciclo ${cycle}...`);
    
    const fullPackageData = await scrapeData(cycle); 

    // Si el scraper dice error: true, falló toda la descarga
    if (!fullPackageData || fullPackageData.error) {
      console.error(`Fallo crítico: No se pudo obtener el paquete completo.`);
      return {
        success: [],
        failed: getBuildings().map(b => b.value),
        skipped: [],
        empty: []
      };
    }

    const fullPackage = fullPackageData.data || {};

    for (const building of getBuildings()) {
      const buildingName = building.value;

      try {
        const data = fullPackage[buildingName];
        let actualData = [];

        if (data && Array.isArray(data)) {
          actualData = data;
        }

        if (actualData.length === 0) {
          console.warn(`Datos vacíos para el edificio: ${buildingName}`);
          resultSummary.empty.push(buildingName);
        } else {
          resultSummary.success.push(buildingName);
        }

        const filePath = path.join(outputDir, `${buildingName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(actualData, null, 2), 'utf-8');
        console.log(`Guardado individual: ${filePath}`);

      } catch (err) {
        console.error(`Error procesando el archivo para ${buildingName}:`, err.message);
        resultSummary.failed.push({ building: buildingName, error: err.message });
      }
    }

    return resultSummary;

  } catch (err) {
    console.error(`No se puede iniciar la descarga del paquete: ${err.message}`);
    return {
      success: [],
      failed: getBuildings().map(b => b.value),
      skipped: [],
      empty: []
    };
  }
};

module.exports = { saveAllToFiles };