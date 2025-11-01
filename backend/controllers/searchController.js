const cache = require('../scraper/cache');
const { scrapeData } = require('../scraper/schedules');
const buildingsData = require('../config/buildings.json');
const buildings = buildingsData.edifp;

// Normalización del nombre del profesor
const normalizeName = (name) => {
  return name
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, '')  // Elimina las tildes
  .replace(/[^a-z\sñ]/g, '')        // Permite letras, espacios y ñ
  .replace(/\s+/g, ' ')             // Reduce espacios múltiples
  .trim();
};

// Verificación de coincidencias entre los nombres
const matchesName = (fullName, normalizedQuery) => {
  if (!normalizedQuery) return false;
  return normalizedQuery
    .split(' ')
    .every(q => fullName.includes(q));
};

const localFiles = async (cycle, building) => {
  try {
    const localData = require(`../data/buildings/${cycle}/${building}.json`);
    const localCacheKey = `local-schedule-${cycle}-building-${building}`;
    const scheduleCacheKey = `schedule-${cycle}-building-${building}`;
    const TTL_LOCAL_FALLBACK = 5 * 60 * 60; // 5 horas

    const alreadyInScheduleCache = await cache.get(scheduleCacheKey);
    if (alreadyInScheduleCache) {
      console.log(`Cache ya existe (scraping o local) para ${building}, no se hace nada.`);
      return true;
    }

    const alreadyCached = await cache.get(localCacheKey);
    if (alreadyCached) {
      console.log(`Cache ya existe para ${building}, se omite lectura de archivo local.`);
      await cache.set(scheduleCacheKey, alreadyCached, TTL_LOCAL_FALLBACK);
      return true;
    }
    await cache.set(scheduleCacheKey, localData, TTL_LOCAL_FALLBACK);
    await cache.set(localCacheKey, localData);
    console.log(`Archivo local cargado para ${building}`);
    return true;
  } catch (fsErr) {
    console.error(`No se encontró archivo local para ${building}.`);
    return false;
  }
}
  
// Función de búsqueda
const getSearch = async (req, res) => {
  const professorName = req.query.name;
  const cycle = req.query.cycle;
  const building = req.query.buildingName || '';
  const day = req.query.day || '';
  console.log(professorName, cycle, building, day);
  
  if (!professorName || !cycle) {
    return res.status(400).json({ error: 'Faltan parámetros: name y cycle son requeridos' });
  }

  const normalizedQuery = normalizeName(professorName);
  if (!normalizedQuery) {
    return res.status(400).json({ error: 'Término de búsqueda inválido' });
  }

  try {
    let results = [];
    // Obtiene todas las claves del caché
    const cacheKeys = await cache.keys();
    // Procesamos todas las claves que corresponden al ciclo
    const cycleCacheKeyPrefix = `schedule-${cycle}-building-`;
    // Verifica si hay match con alguna de las key
    const matchingCacheKeys = cacheKeys.filter(key => key.startsWith(cycleCacheKeyPrefix));

    // Extraemos nombres de edificios desde las claves cacheadas
    const cachedBuildings = matchingCacheKeys.map(key =>
      key.replace(cycleCacheKeyPrefix, '')
    );

    // Filtra los edificios que aún no están cacheados (ni siquiera array un vacío)
    const buildingsToScrape = buildings.filter(building => !cachedBuildings.includes(building.value));

    if (buildingsToScrape.length > 0 && cachedBuildings.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 4000));

      console.log(`${buildingsToScrape.length} edificios no están cacheados. Se procederá a scrapear.`);

      for (const building of buildingsToScrape) {
        const scrapeResult = await scrapeData(cycle, building.value);
        await new Promise(res => setTimeout(res, 100));

        if (scrapeResult?.error) {
          console.warn(`Scraping fallido para ${building.value}. Intentando archivo local...`);
          const loaded = await localFiles(cycle, building.value);
          if (!loaded) {
            console.error(`No se pudo obtener datos de ningún edificio (ni scraping ni local). Cancelando búsqueda.`);
            return res.status(500).json({ error: 'No hay datos disponibles para realizar la búsqueda. SIIAU no responde y no existen archivos del ciclo en el servidor.' });
          }
        }
      }
    }
    else if ( cachedBuildings.length === 0 ) {
      console.log(`${buildingsToScrape.length} edificios no están cacheados. Se procederá a scrapear.`);

      for (const building of buildingsToScrape) {
        const scrapeResult = await scrapeData(cycle, building.value);
        await new Promise(res => setTimeout(res, 250));

        if (scrapeResult?.error) {
          console.warn(`Scraping fallido para ${building.value}. Intentando archivo local...`);
          const loaded = await localFiles(cycle, building.value);
          if (!loaded) {
            console.error(`No se pudo obtener datos de ningún edificio (ni scraping ni local). Cancelando búsqueda.`);
            return res.status(500).json({ error: 'No hay datos disponibles para realizar la búsqueda. SIIAU no responde y no existen archivos del ciclo en el servidor.' });
          }
        }
      }
    }

    const updatedCacheKeys = await cache.keys();

    for (let cacheKey of updatedCacheKeys) {
      // Procesa solo los cachés que corresponden al ciclo
      if (cacheKey.startsWith(cycleCacheKeyPrefix)) {
        const data = await cache.get(cacheKey);

        if (data && Array.isArray(data)) {
          // Filtra los resultados que coinciden con el nombre del profesor
          const filteredResults = data.filter(item => {
            const normalizedFullName = normalizeName(item.professor);
            const match = matchesName(normalizedFullName, normalizedQuery);
            return match;
          });

          // Agrega al array de resultados
          results.push(...filteredResults);
        }
      }
    }


    const dayPriority = {
      'L': 1,
      'M': 2,
      'I': 3,
      'J': 4,
      'V': 5,
      'S': 6,
      '.': 7
    };

    function getEarliestDayPriority(daysStr) {
      const days = daysStr.split(' ').filter(d => d !== '');
      return days.reduce((min, d) => {
        const pr = dayPriority[d] ?? 7;
        return pr < min ? pr : min;
      }, 7);
    }

    function getStartTime(scheduleStr) {
      if (!scheduleStr) return 9999;
      const [start] = scheduleStr.split('-');
      return parseInt(start, 10);
    }

    results.sort((a, b) => {
      const aDayPr = getEarliestDayPriority(a.data.days || '');
      const bDayPr = getEarliestDayPriority(b.data.days || '');

      // Primero por día
      if (aDayPr !== bDayPr) {
        return aDayPr - bDayPr;
      }

      // Ordena por hora
      const aStart = getStartTime(a.data.schedule);
      const bStart = getStartTime(b.data.schedule);

      return aStart - bStart;
    });


    // Envia los resultados
    if (results.length === 0) {
      console.log('No se encontraron resultados para este profesor.');
      return res.json({ message: 'No se encontraron horarios para este profesor.' });
    }

    res.json(results);
  } catch (error) {
    console.error("Error en la búsqueda de profesor:", error.message);
    res.status(500).json({ error: 'Error interno al buscar profesor' });
  }
};

module.exports = { getSearch };
