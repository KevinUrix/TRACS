const fs = require('fs').promises;
const path = require('path');


//
// OBTENER EDIFICIOS
//
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


//
// BORRAR EDIFICIO
//
const deleteBuilding = async (req, res) => {
  const { buildingName, buildingText } = req.query;
  const filePath = path.join(__dirname, '../config/buildings.json');

  if (!buildingName || !buildingText) {
    console.error("Parámetros no encontrados");
    return res.status(400).json({ error: 'Faltan parámetros para eliminar el edificio.' });
  }

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    let currentData = JSON.parse(fileContent);

    if (!Array.isArray(currentData.edifp)) {
      currentData.edifp = [];
    }

    // Filtrar los edificios que NO coinciden (los que se deben conservar)
    currentData.edifp = currentData.edifp.filter(building =>
      !(
        building.value === buildingName &&
        building.text === buildingText
      )
    );

    await fs.writeFile(filePath, JSON.stringify(currentData, null, 2));
    res.json({ message: 'Edificio eliminado con éxito' });

  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'No hay edificios' });
    }

    console.error("Error al eliminar el edificio:", error.message);
    res.status(500).json({ error: 'Error interno al eliminar el edificio' });
  }
};


//
// EDITAR RESERVAS
//
const updateBuilding = async (req, res) => {
  const { buildingName, buildingText } = req.query;
  const updatedData = req.body;

  if (!updatedData || !updatedData.value || !updatedData.text) {
    return res.status(400).json({ error: 'Faltan datos obligatorios para la reserva' });
  }

  const filePath = path.join(__dirname, `../config/buildings.json`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    let currentData = JSON.parse(fileContent);

    if (!Array.isArray(currentData.edifp)) {
      currentData.edifp = [];
    }

    const index = currentData.edifp.findIndex(building =>
      building.value === buildingName &&
      building.text === buildingText
    );

    if (index === -1) {
      return res.status(404).json({ error: 'Edificio no encontrado para modificar' });
    }

    // Reemplazar la reserva en el índice encontrado
    const orderedBuilding = {
      value: updatedData.value,
      text: updatedData.text,
    };

    currentData.edifp[index] = orderedBuilding;

    await fs.writeFile(filePath, JSON.stringify(currentData, null, 2), 'utf-8');
    res.json({ message: 'Reserva actualizada con éxito' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Registro no encontrado - buildings`);
      return res.status(404).json({ message: 'No existe el edificio' });
    }

    console.error("Error al actualizar el edificio:", error.message);
    res.status(500).json({ error: 'Error interno al actualizar el edificio' });
  }
};

module.exports = {
  getBuildings,
  deleteBuilding,
  updateBuilding
};
