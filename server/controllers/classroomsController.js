const fs = require('fs').promises;
const path = require('path');

const getClassrooms = async (req, res) => {
  const { buildingName } = req.query;

  if (!buildingName) {
    return res.status(400).json({ error: 'No se recibió el edificio' });
  }

  const filePath = path.join(__dirname, `../config/classrooms/${buildingName}.json`);

  try {
    const data = await fs.readFile(filePath, 'utf8');
    const classrooms = JSON.parse(data);
    res.json(classrooms);
    
  } catch (error) {
    console.error('Error al leer el archivo de salones:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar los salones' });
  }
};

module.exports = {
  getClassrooms,
};
