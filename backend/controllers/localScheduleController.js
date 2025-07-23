const fs = require('fs').promises;
const path = require('path');
const cache = require('../scraper/cache');
const buildingsData = require('../config/buildings.json');


const localSchedule = async (req, res) => {
  const { cycle, buildingName } = req.query;

  if (!cycle || !buildingName) {
    return res.status(400).json({ error: 'No se recibió el ciclo, el edificio o ambos' });
  }

  const cacheKey = `local-schedule-${cycle}-building-${buildingName}`;
  const filePath = path.join(__dirname, `../data/buildings/${cycle}/${buildingName}.json`);

  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`Horario de ${buildingName} obtenido desde caché local.`);
      return res.json(cached);
    }

    const fileData = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(fileData);

    // Guarda solo si el archivo existe y es válido
    await cache.set(cacheKey, json);
    console.log(`Horario de ${buildingName} guardado en caché desde archivo local.`);

    // Lanza background para guardar los demás
    backgroundCacheAll(cycle, buildingName);

    return res.json(json);
  } catch (error) {
    console.error('Error al obtener el horario:', error.message);
    return res.status(500).json({ error: 'No se pudieron cargar los horarios' });
  }
};

const backgroundCacheAll = async (cycle, skipBuilding) => {
  const buildings = buildingsData.edifp.map(b => b.value);
  for (const building of buildings) {
    if (building === skipBuilding) continue;

    const filePath = path.join(__dirname, `../data/buildings/${cycle}/${building}.json`);
    const cacheKey = `local-schedule-${cycle}-building-${building}`;

    try {
      const fileData = await fs.readFile(filePath, 'utf8');
      const json = JSON.parse(fileData);
      await cache.set(cacheKey, json);
      console.log(`Horario en caché: ${building} desde local`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`Archivo no encontrado para ${building}, no se guarda en caché.`);
      } else {
        console.error(`Error al procesar ${building}:`, error.message);
      }
    }
  }
};

module.exports = {
  localSchedule,
};
