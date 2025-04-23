const fs = require('fs').promises;
const path = require('path');

const saveReservation = async (req, res) => {
  const { cycle, buildingName } = req.query;
  const reservationData = req.body;
  const filePath = path.join(__dirname, `../../public/data/reservations/${cycle}/${buildingName}.json`);

  if (!reservationData || !reservationData.course || !reservationData.professor) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    try {
      await fs.access(filePath);
    } catch (error) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify({ data: [] }, null, 2));
    }

    const fileContent = await fs.readFile(filePath, 'utf-8');
    let currentData = { data: [] };

    // Si el archivo tiene contenido, intenta parsearlo, si no, mantiene el array vacío
    if (fileContent.trim() !== '') {
      try {
        currentData = JSON.parse(fileContent);
        
        if (!Array.isArray(currentData.data)) {
          currentData.data = [];
        }
      } catch (error) {
        console.error("Error al parsear el archivo JSON:", error.message);
        currentData = { data: [] }; // Si el archivo tiene un formato incorrecto, inicializamos con datos vacíos
      }
    }

    // Agrega la nueva reserva a los datos existentes
    currentData.data.push(reservationData);

    await fs.writeFile(filePath, JSON.stringify(currentData, null, 2));

    // Responde con éxito
    res.status(201).json({ message: 'Reserva guardada con éxito' });
  } catch (error) {
    console.error("Error al guardar la reserva:", error);
    res.status(500).json({ error: 'Hubo un error al guardar la reserva' });
  }
};


const deleteReservation = async (req, res) => {
  const { cycle, buildingName, professor, schedule, date } = req.query;
  const filePath = path.join(__dirname, `../../public/data/reservations/${cycle}/${buildingName}.json`);

  try {
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const fileContent = await fs.readFile(filePath, 'utf-8');
    let currentData = JSON.parse(fileContent);

    // Asegurarse de que `data` siempre sea un array
    if (!Array.isArray(currentData.data)) {
      currentData.data = [];
    }

    // Filtrar las reservas que NO coincidan con los criterios
    const filteredReservations = currentData.data.filter(reserva => {
      return !(
        reserva.schedule === schedule &&
        reserva.building === buildingName &&
        reserva.date === date &&
        reserva.professor === professor
      );
    });

    // Si no quedan reservas después del filtrado, aseguramos que `data` sea un array vacío
    currentData.data = filteredReservations;

    // Escribir el archivo con el formato correcto de un array
    await fs.writeFile(filePath, JSON.stringify(currentData, null, 2));

    res.json({ message: 'Reservas eliminadas con éxito' });
  } catch (error) {
    console.error("Error al eliminar la reserva:", error.message);
    res.status(500).json({ error: 'Error interno al eliminar la reserva' });
  }
};


module.exports = {
  saveReservation,
  deleteReservation,
};
