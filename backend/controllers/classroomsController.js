const fs = require('fs').promises;
const path = require('path');

const getClassrooms = async (req, res) => {
  const { buildingName } = req.query;

  if (!buildingName || !/^[a-zA-Z0-9_-]+$/.test(buildingName)) {
    return res.status(400).json({ error: 'Edificio inválido' });
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
    const { buildingName } = req.query;
    const { classrooms } = req.body;

    if (!buildingName || !/^[a-zA-Z0-9_-]+$/.test(buildingName)) {
      return res.status(400).json({ error: 'Edificio inválido' });
    }

    if (!classrooms || !Array.isArray(classrooms)) {
      return res.status(400).json({ error: 'Formato de salones inválido o vacío' });
    }

    const dir = path.join(__dirname, '../config/classrooms');
    const filePath = path.join(dir, `${buildingName}.json`);
    await fs.mkdir(dir, { recursive: true });

    const hourFormatRegex = /^\d{4}-\d{4}$/; 

    const resultObjs = classrooms.map(room => {
      const rawName = typeof room === 'string' ? room : (room.name || '');
      const name = rawName.replace(/[^a-zA-Z0-9]/g, '');
      
      const capDigits = room.capacity ? String(room.capacity).replace(/[^0-9]/g, '') : '';
      const capacity = capDigits === '' ? null : capDigits;

      let isAccessible = false;
      if (room.isAccessible === true) {
        isAccessible = true;
      } else if (room.isAccessible && typeof room.isAccessible === 'object' && !Array.isArray(room.isAccessible)) {
        isAccessible = {};
        const validDays = ['L', 'M', 'I', 'J', 'V', 'S'];
        
        for (const [day, hours] of Object.entries(room.isAccessible)) {
          if (validDays.includes(day)) {
            if (Array.isArray(hours)) {
              const validHours = hours.filter(h => typeof h === 'string' && hourFormatRegex.test(h.trim()));
              if (validHours.length > 0) {
                isAccessible[day] = validHours.map(h => h.trim());
              }
            } else if (typeof hours === 'string' && hourFormatRegex.test(hours.trim())) {
              isAccessible[day] = [hours.trim()];
            }
          }
        }
        if (Object.keys(isAccessible).length === 0) {
          isAccessible = false;
        }
      }

      const validServicesList = ['aire', 'proyector', 'pantalla', 'audio', 'ventilador', 'red', 'computadora', 'pintarron', 'enchufe'];
      
      const services = Array.isArray(room.services) 
        ? room.services.filter(s => typeof s === 'string' && validServicesList.includes(s.toLowerCase().trim()))
        : [];

      const validFloors = ['PB', '1', '2', '3'];
      const floor = validFloors.includes(String(room.floor)) ? String(room.floor) : '';

      return { name, capacity, isAccessible, services, floor };
    }).filter(room => room.name !== '');

    await fs.writeFile(filePath, JSON.stringify(resultObjs, null, 2), 'utf8');
    return res.status(200).json({ message: 'Salones guardados correctamente' });
  } catch (error) {
    console.error('Error al guardar los salones:', error.message);
    return res.status(500).json({ error: 'No se pudieron guardar los salones' });
  }
};

const resetAccessibility = async (req, res) => {
  const { buildingName } = req.query;

  if (!buildingName || !/^[a-zA-Z0-9_-]+$/.test(buildingName)) {
    return res.status(400).json({ error: 'Edificio inválido' });
  }

  const filePath = path.join(__dirname, `../config/classrooms/${buildingName}.json`);

  try {
    const data = await fs.readFile(filePath, 'utf8');
    const classrooms = JSON.parse(data);

    const updatedClassrooms = classrooms.map(room => {
      const name = typeof room === 'string' ? room : (room.name || '');
      return {
        name,
        capacity: room.capacity || null,
        isAccessible: false,
        services: room.services || [],
        floor: room.floor || ''
      };
    });

    await fs.writeFile(filePath, JSON.stringify(updatedClassrooms, null, 2), 'utf8');

    return res.status(200).json({ message: `Accesibilidad removida para todos los salones de ${buildingName}` });
  } catch (error) {
    console.error(`Error al restablecer la accesibilidad de ${buildingName}:`, error.message);
    return res.status(500).json({ error: 'No se pudo restablecer la accesibilidad' });
  }
};

module.exports = { getClassrooms, saveClassrooms, resetAccessibility };