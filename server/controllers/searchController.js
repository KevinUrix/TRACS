const cache = require('../scraper/cache');

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
  console.log(professorName, cycle, building);

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
    const cacheKeys = cache.keys();
    // Procesar todas las claves que corresponden al ciclo
    const cycleCacheKeyPrefix = `schedule-${cycle}-building-`;

    for (let cacheKey of cacheKeys) {
      // Procesar solo los cachés que corresponden al ciclo
      if (cacheKey.startsWith(cycleCacheKeyPrefix)) {
        const data = cache.get(cacheKey);

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
