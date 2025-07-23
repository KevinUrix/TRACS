const fs = require('fs');
const path = require('path');

const processFilesInFolder = () => {
  const folderPath = path.join(__dirname, '../data/buildings/');

  try {
    const files = fs.readdirSync(folderPath);
    const buildingsData = {};

    files.filter(file => file.endsWith('.json')).forEach(file => {
      const filePath = path.join(folderPath, file);
      console.log(`Procesando archivo: ${file}`);
      processFile(filePath, buildingsData);
    });

    saveBuildingsData(buildingsData);
  } catch (err) {
    console.error('Error al leer los archivos de la carpeta:', err);
  }
};

// Se extraen los salones
const processFile = (inputFilePath, buildingsData) => {
  try {
    const json = JSON.parse(fs.readFileSync(inputFilePath, 'utf-8'));

    // Iterar sobre cada edificio
    Object.entries(json).forEach(([buildingKey, buildingData]) => {
      if (Array.isArray(buildingData)) {
        const classrooms = extractClassrooms(buildingData);
        if (classrooms.length > 0) {
          buildingsData[buildingKey] = classrooms;
        }
      }
    });
  } catch (err) {
    console.error(`Error al procesar el archivo ${inputFilePath}:`, err);
  }
};

// Extrae y ordenar los salones, tambié se filtran duplicados
const extractClassrooms = (buildingData) => {
  const classrooms = [...new Set(buildingData.map(item => item.data.classroom).filter(Boolean))];
  return classrooms.sort();
};

const saveBuildingsData = (buildingsData) => {
  try {
    Object.entries(buildingsData).forEach(([building, classrooms]) => {
      const outputFilePath = path.join(__dirname, `../data/classrooms/${building}.json`);
      fs.writeFileSync(outputFilePath, JSON.stringify(classrooms, null, 2), 'utf-8');
    });
  } catch (err) {
    console.error('Error al guardar los archivos de los edificios:', err);
  }
};

processFilesInFolder();
