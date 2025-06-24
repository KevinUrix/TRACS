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
    // Obtener todas las claves del caché
    const cacheKeys = await cache.keys();
    // Procesar todas las claves que corresponden al ciclo
    const cycleCacheKeyPrefix = `schedule-${cycle}-building-`;
    // Verifica si hay match con alguna de las key
    const matchingCacheKeys = cacheKeys.filter(key => key.startsWith(cycleCacheKeyPrefix));

    // Extraer nombres de edificios desde las claves cacheadas
    const cachedBuildings = matchingCacheKeys.map(key =>
      key.replace(cycleCacheKeyPrefix, '')
    );

    // Filtrar los edificios que aún no están cacheados (ni siquiera array un vacío)
    const buildingsToScrape = buildings.filter(building => !cachedBuildings.includes(building.value));

    if (buildingsToScrape.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 7000));

      console.log(`${buildingsToScrape.length} edificios no están cacheados. Se procederá a scrapear.`);

      for (const building of buildingsToScrape) {
        await scrapeData(cycle, building.value);
      }
    }

    const updatedCacheKeys = await cache.keys();

    for (let cacheKey of updatedCacheKeys) {
      // Procesar solo los cachés que corresponden al ciclo
      if (cacheKey.startsWith(cycleCacheKeyPrefix)) {
        const data = await cache.get(cacheKey);

        if (data && Array.isArray(data)) {
          // Filtra los resultados que coinciden con el nombre del profesor
          const filteredResults = data.filter(item => {
            const normalizedFullName = normalizeName(item.professor);
            const match = matchesName(normalizedFullName, normalizedQuery);
            return match;
          });

          // Agregar al array de resultados
          results.push(...filteredResults);
        }
      }
    }

    // Ordenar solo si se recibió un building
    if (building) {
      results.sort((a, b) => {
        const aInBuilding = a.data.building === building ? -1 : 1;
        const bInBuilding = b.data.building === building ? -1 : 1;
        return aInBuilding - bInBuilding;
      });
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

    // Ordenamiento por día
    results.sort((a, b) => {
      const aDays = a.data.days.split(' ').filter(d => d !== '.' && d !== '');
      const bDays = b.data.days.split(' ').filter(d => d !== '.' && d !== '');

      // Si el día que se busca existe en el array, se le da la mayor prioridad.
      const aHasSelectedDay = aDays.includes(day);
      const bHasSelectedDay = bDays.includes(day);

      if (aHasSelectedDay && !bHasSelectedDay) return -1;
      if (!aHasSelectedDay && bHasSelectedDay) return 1;

      // Si no hay coincidencia, se ordena por prioridad normal
      const aBestDay = aDays.reduce((min, d) => {
        const priority = dayPriority[d] ?? 7;
        return Math.min(min, priority);
      }, 7);

      const bBestDay = bDays.reduce((min, d) => {
        const priority = dayPriority[d] ?? 7;
        return Math.min(min, priority);
      }, 7);

      return aBestDay - bBestDay;
    });


    // Enviar los resultados
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
