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
// EDITAR EDIFICIO
//
const updateBuilding = async (req, res) => {
  const { buildingName, buildingText } = req.query;
  const updatedData = req.body;

  if (!updatedData || !updatedData.value || !updatedData.text) {
    return res.status(400).json({ error: 'Faltan datos obligatorios para el edificio' });
  }
  
  const filePath = path.join(__dirname, `../config/buildings.json`);
  const classroomsPath = path.join(__dirname, `../config/classrooms`);
  const oldFilePath = path.join(classroomsPath, `${buildingName}.json`);
  const newFilePath = path.join(classroomsPath, `${updatedData.value}.json`);

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


    // Si existe el archivo con el nombre antiguo, lo renombramos
    if (await fs.access(oldFilePath).then(() => true).catch(() => false)) {
      await fs.rename(oldFilePath, newFilePath);
      console.log(`Archivo de salones renombrado: ${buildingName} -> ${updatedData.value}`);
    } else {
      console.warn(`El archivo ${oldFilePath} no existe, no se pudo renombrar.`);
    }

    // Reemplazar la reserva en el índice encontrado
    const orderedBuilding = {
      value: updatedData.value,
      text: updatedData.text,
    };

    currentData.edifp[index] = orderedBuilding;

    await fs.writeFile(filePath, JSON.stringify(currentData, null, 2), 'utf-8');
    res.json({ message: 'Edificio actualizado con éxito' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Registro no encontrado - buildings`);
      return res.status(404).json({ message: 'No existe el edificio' });
    }
    console.error("Error al actualizar el edificio:", error.message);
    res.status(500).json({ error: 'Error interno al actualizar el edificio' });
  }
};


//
// GUARDAR EDIFICIO
//
const saveBuilding = async (req, res) => {
  const buildingData = req.body;
  const filePath = path.join(__dirname, `../config/buildings.json`);
  const classroomsPath = path.join(__dirname, `../config/classrooms`);
  const classroomFile = path.join(classroomsPath, `${buildingData.value}.json`);

  if (!buildingData || !buildingData.value || !buildingData.text) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    let currentData = { edifp: [] };
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      if (fileContent.trim()) {
        const parsed = JSON.parse(fileContent);
        currentData.edifp = Array.isArray(parsed.edifp) ? parsed.edifp : [];
      }
    } catch (readErr) {
      console.warn('Archivo inexistente o corrupto, se inicializa vacío');
    }

    currentData.edifp.push(buildingData);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(currentData, null, 2));

    // Crear el archivo del edificio
    await fs.mkdir(classroomsPath, { recursive: true });
    try {
      await fs.access(classroomFile);
      console.log(`El archivo ${buildingData.value}.json ya existe, no se sobreescribirá.`);
    } catch {
      await fs.writeFile(classroomFile, JSON.stringify([], null, 2));
      console.log(`Archivo ${buildingData.value}.json creado correctamente.`);
    }

    res.status(201).json({
      message: 'Edificio y su archivo de aulas guardados con éxito',
    });
  } catch (error) {
    console.error('Error al guardar edificio:', error.message);
    res.status(500).json({ error: 'Hubo un error al guardar el edificio' });
  }
};



module.exports = {
  getBuildings,
  deleteBuilding,
  updateBuilding,
  saveBuilding
};
