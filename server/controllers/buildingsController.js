const fs = require('fs').promises;
const path = require('path');

const getBuildings = async (req, res) => {

  const filePath = path.join(__dirname, `../config/buildings.json`);

  try {
    const data = await fs.readFile(filePath, 'utf8');
    const buildings = JSON.parse(data);
    res.json(buildings);
    
  } catch (error) {
    console.error('Error al leer el archivo de edificios:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar los edificios' });
  }
};

module.exports = {
  getBuildings,
};
