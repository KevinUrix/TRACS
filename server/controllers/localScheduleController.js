const fs = require('fs').promises;
const path = require('path');

const localSchedule = async (req, res) => {
  const { cycle, buildingName } = req.query;

  if (!cycle || !buildingName) {
    return res.status(400).json({ error: 'No se recibió el ciclo, el edificio o ambos' });
  }

  const filePath = path.join(__dirname, `../data/buildings/${cycle}/${buildingName}.json`);

  try {
    const data = await fs.readFile(filePath, 'utf8');
    const localSchedule = JSON.parse(data);
    res.json(localSchedule);
    
  } catch (error) {
    console.error('Error al leer el archivo local:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar los horarios' });
  }
};

module.exports = {
  localSchedule,
};
