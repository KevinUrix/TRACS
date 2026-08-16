const fs = require('fs').promises;
const path = require('path');
const cache = require('../scraper/cache');
const buildingsData = require('../config/buildings.json');

const localSchedule = async (req, res) => {
  const { cycle } = req.query;

  if (!cycle) {
    return res.status(400).json({ error: 'No se recibió el ciclo' });
  }

  const cacheKey = `local-schedule-all-${cycle}`;

  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log(`Horarios locales del ciclo ${cycle} obtenidos desde caché.`);
      return res.json(cached);
    }

    const fallbackData = {};
    const buildings = buildingsData.edifp.map(b => b.value);

    for (const building of buildings) {
      const filePath = path.join(__dirname, `../data/buildings/${cycle}/${building}.json`);
      try {
        const fileData = await fs.readFile(filePath, 'utf8');
        fallbackData[building] = JSON.parse(fileData);
      } catch (error) {
        if (error.code === 'ENOENT') {
          fallbackData[building] = [];
        } else {
          console.error(`Error al leer archivo ${building}:`, error.message);
          fallbackData[building] = [];
        }
      }
    }

    await cache.set(cacheKey, fallbackData, 14400); // Guardamos por 4 horas
    console.log(`Horarios locales del ciclo ${cycle} obtenidos y guardados en caché.`);

    return res.json(fallbackData);
  } catch (error) {
    console.error('Error al ensamblar los horarios locales:', error.message);
    return res.status(500).json({ error: 'No se pudieron cargar los horarios' });
  }
};

module.exports = {
  localSchedule,
};