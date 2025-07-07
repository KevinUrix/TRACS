const fs = require('fs').promises;
const path = require('path');
const cache = require('../scraper/cache');

const localCycles = async (req, res) => {
  const filePath = path.join(__dirname, '../data/cycles.json');

  try {
    const data = await fs.readFile(filePath, 'utf8');
    const cycles = JSON.parse(data);
    
    // Guardar en caché
    await cache.set('local-cycles', cycles);
    console.log('✅ Ciclos obtenidos desde archivo local y guardados en caché');

    res.status(200).json(cycles);

  } catch (error) {
    console.error('❌ Error al leer el archivo de ciclos:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar los ciclos locales' });
  }
};

module.exports = { localCycles };
