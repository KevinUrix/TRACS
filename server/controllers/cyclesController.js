const { scrapeCycles } = require('../scraper/cycles');
const cache = require('../scraper/cache');

const getCycles = async (req, res) => {
  try {
    const cached = await cache.get('cycles');

    if (cached) {
      console.log("✅ Ciclos obtenidos desde caché");
      return res.status(200).json(cached);
    }
    else {
      console.warn("⚠️ Caché del scraper vacío o corrupto. Buscando en caché local...");
    }
  } catch (err) {
    console.warn('⚠️ No se pudo acceder al caché:', err.message);
    // Continúa sin usar caché
  }

  // Intentar desde local-cycles
  try {
    const localCached = await cache.get('local-cycles');

    if (Array.isArray(localCached) && localCached.length > 0) {
      console.log("✅ Ciclos obtenidos desde caché local");
      return res.status(200).json(localCached);
    } else {
      console.warn("⚠️ Caché 'local-cycles' vacío o corrupto.");
    }
  } catch (err) {
    console.warn("⚠️ No se pudo acceder al caché 'local-cycles':", err.message);
  }

  try {
    const cycles = await scrapeCycles();
    
    if (Array.isArray(cycles) && cycles.length > 0) {
      try {
        console.log("Ciclos obtenidos - scraper");
        await cache.set('cycles', cycles);
        console.log("✅ Ciclos almacenados en caché - scraper.");
      } catch (err) {
        console.warn('⚠️ No se pudo guardar en caché:', err.message);
      }
    } else {
      console.warn("⚠️ Ciclos vacíos, no se guardan en caché");
    }

    res.status(200).json(cycles);
  } catch (error) {
    console.error('❌ Error al obtener los ciclos:', error.message);
    res.status(500).json({ message: 'Error al obtener los ciclos' });
  }
};

module.exports = { getCycles };
