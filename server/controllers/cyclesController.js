const { scrapeCycles } = require('../scraper/cycles');
const cache = require('../scraper/cache');

const getCycles = async (req, res) => {
  try {
    const cached = await cache.get('cycles');

    if (cached) {
      console.log("Ciclos obtenidos desde caché");
      return res.status(200).json(cached);
    }
  } catch (err) {
    console.warn('⚠️ No se pudo acceder al caché de Redis:', err.message);
    // Continúa sin usar caché
  }

  try {
    const cycles = await scrapeCycles();
    console.log("Ciclos obtenidos - scraper");
    try {
      await cache.set('cycles', cycles);
    } catch (err) {
      console.warn('⚠️ No se pudo guardar en caché:', err.message);
    }

    res.status(200).json(cycles);
  } catch (error) {
    console.error('Error al obtener los ciclos:', error.message);
    res.status(500).json({ message: 'Error al obtener los ciclos' });
  }
};

module.exports = { getCycles };
