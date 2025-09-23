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


const saveClassrooms = async (req, res) => {
  try {
    const { buildingName, classrooms } = req.query;

    if (!buildingName || !classrooms) {
      return res.status(400).json({ error: 'No se recibió el edificio' });
    }
  
    const filePath = path.join(__dirname, `../config/classrooms/${buildingName}.json`);
    const classroomsArray = [...new Set(
      classrooms
        .trim()
        .split(/\s+/)
        .map(s => s.replace(/[^a-zA-Z0-9]/g, ''))
        .filter(Boolean)
    )];

    await fs.writeFile(filePath, JSON.stringify(classroomsArray, null, 2), 'utf8');

    return res.status(200).json({ message: 'Salones guardados correctamente' });
  } catch (error) {
    console.error('Error al guardar los salones:', error.message);
    res.status(500).json({ error: 'No se pudieron guardar los salones' });
  }
};

module.exports = {
  getClassrooms,
  saveClassrooms
};
