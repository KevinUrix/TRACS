const { scrapeCycles } = require('../scraper/cycles');

const getCycles = async (req, res) => {
  try {
    const cycles = await scrapeCycles();
    
    if (Array.isArray(cycles) && cycles.length > 0) {
      return res.status(200).json(cycles);
    } else {
      console.warn("Ciclos vacíos, el scraper no obtuvo resultados.");
      return res.status(500).json({ message: 'El scraper no trajo datos válidos' });
    }

  } catch (error) {
    console.error('Error al obtener los ciclos de SIIAU:', error.message);
    return res.status(500).json({ message: 'Error al obtener los ciclos' });
  }
};

module.exports = { getCycles };