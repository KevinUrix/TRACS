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
    if (!buildingName || classrooms == null) {
      return res.status(400).json({ error: 'No se recibió el edificio' });
    }

    const dir = path.join(__dirname, '../config/classrooms');
    const filePath = path.join(dir, `${buildingName}.json`);
    await fs.mkdir(dir, { recursive: true });

    const tokens = classrooms.trim().split(/\s+/).filter(Boolean);

    const byName = new Map();
    for (const raw of tokens) {
      const cleaned = raw.replace(/[^a-zA-Z0-9:\s]/g, '');
      if (!cleaned) continue;

      const [nameRaw, capRawRaw = ''] = cleaned.split(':');
      const name = (nameRaw || '').replace(/[^a-zA-Z0-9]/g, '');
      if (!name) continue;

      const capDigits = capRawRaw.replace(/[^0-9]/g, '');
      const hasColon = cleaned.includes(':');

      // Reglas:
      // - "LC01" (sin : ) -> capacity = null (remueve cupo si existía)
      // - "LC01:" (vacío) -> capacity = null (remueve cupo)
      // - "LC01:10"       -> capacity = "10"
      // - "LC01:0"        -> capacity = "0" (válido)
      let capacity = null;
      if (hasColon) {
        capacity = capDigits === '' ? null : capDigits;
      } else {
        capacity = null; // sin ":" -> Sin cupos
      }

      byName.set(name, capacity);
    }

    const resultObjs = [];
    let anyCaps = false;
    for (const [name, capacity] of byName.entries()) {
      if (capacity !== null) {
        resultObjs.push({ name, capacity }); // guarda objeto con capacidad
        anyCaps = true;
      } else {
        resultObjs.push({ name }); // sin capacidad
      }
    }

    const toSave = anyCaps ? resultObjs : resultObjs.map(x => x.name);

    await fs.writeFile(filePath, JSON.stringify(toSave, null, 2), 'utf8');
    return res.status(200).json({ message: 'Salones guardados correctamente' });
  } catch (error) {
    console.error('Error al guardar los salones:', error.message);
    return res.status(500).json({ error: 'No se pudieron guardar los salones' });
  }
};


module.exports = {
  getClassrooms,
  saveClassrooms
};
