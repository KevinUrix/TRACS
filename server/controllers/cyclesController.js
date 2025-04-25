const { scrapeCycles } = require('../scraper/cycles');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 43200 });

const getCycles = async (req, res) => {
  const cached = cache.get('cycles');

  if (cached) {
    console.log("Ciclos obtenidos desde caché");
    return res.status(200).json(cached);
  }

  try {
    const cycles = await scrapeCycles();
    cache.set('cycles', cycles);
    res.status(200).json(cycles);
    
  } catch (error) {
    console.error('Error al obtener los ciclos:', error.message);
    res.status(500).json({ message: 'Error al obtener los ciclos' });
  }
};

module.exports = { getCycles };
