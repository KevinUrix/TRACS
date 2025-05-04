const fs = require('fs').promises;
const path = require('path');
const { createGoogleEvent } = require('../utils/createGoogleEvent');

//
// GUARDAR RESERVAS
//
const saveReservation = async (req, res) => {
  const { cycle, buildingName } = req.query;
  const reservationData = req.body;
  const filePath = path.join(__dirname, `../data/reservations/${cycle}/${buildingName}.json`);

  if (!reservationData || !reservationData.course || !reservationData.professor) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {

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

    let googleEventId = null;
    if (reservationData.createInGoogleCalendar) {
      try {
        googleEventId = await createGoogleEvent(reservationData);
      } catch (calendarError) {
        console.error('Error al crear evento en Google Calendar:', calendarError.message);
      }
    }

    if (googleEventId) {
      reservationData.googleEventId = googleEventId;
    }

    // Agrega la nueva reserva a los datos existentes
    currentData.data.push(reservationData);
    await fs.writeFile(filePath, JSON.stringify(currentData, null, 2));


    // Responde con éxito
    res.status(201).json({ message: 'Reserva guardada con éxito', googleEventId: googleEventId || null });
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify({ data: [] }, null, 2));
      return saveReservation(req, res);  // Llamada recursiva para guardar después de crear el archivo
    }
    
    console.error("Error al guardar la reserva:", error);
    res.status(500).json({ error: 'Hubo un error al guardar la reserva' });
  }
};


//
// BORRAR RESERVAS
//
const deleteReservation = async (req, res) => {
  const { cycle, buildingName, professor, schedule, date } = req.query;
  const filePath = path.join(__dirname, `../data/reservations/${cycle}/${buildingName}.json`);

  try {

    const fileContent = await fs.readFile(filePath, 'utf-8');
    let currentData = JSON.parse(fileContent);

    // Asegurarse de que `data` siempre sea un array
    if (!Array.isArray(currentData.data)) {
      currentData.data = [];
    }

    // Filtrar las reservas que NO coincidan con los criterios
    const filteredReservations = currentData.data.filter(reservation => {
      return !(
        reservation.schedule === schedule &&
        reservation.building === buildingName &&
        reservation.date === date &&
        reservation.professor === professor
      );
    });

    // Si no quedan reservas después del filtrado, aseguramos que `data` sea un array vacío
    currentData.data = filteredReservations;
    await fs.writeFile(filePath, JSON.stringify(currentData, null, 2));

    res.json({ message: 'Reservas eliminadas con éxito' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Archivo no encontrado para: ${cycle} - ${buildingName}`);
      return res.status(404).json({ message: 'No hay reservas para este ciclo y edificio' });
    }
    
    console.error("Error al eliminar la reserva:", error.message);
    res.status(500).json({ error: 'Error interno al eliminar la reserva' });
  }
};


//
// EDITAR RESERVAS
//
const updateReservation = async (req, res) => {
  const { cycle, buildingName, originalProfessor, originalSchedule, originalDate} = req.query;
  const updatedData = req.body;

  if (!updatedData || !updatedData.course || !updatedData.professor) {
    return res.status(400).json({ error: 'Faltan datos obligatorios para la reserva' });
  }

  const filePath = path.join(__dirname, `../data/reservations/${cycle}/${buildingName}.json`);

  try {

    const fileContent = await fs.readFile(filePath, 'utf-8');
    let currentData = JSON.parse(fileContent);

    if (!Array.isArray(currentData.data)) {
      currentData.data = [];
    }

    const index = currentData.data.findIndex(res =>
      res.professor === originalProfessor &&
      res.schedule === originalSchedule &&
      res.date === originalDate
    );

    if (index === -1) {
      return res.status(404).json({ error: 'Reserva no encontrada para modificar' });
    }

    // Reemplazar la reserva en el índice encontrado
    const orderedReservation = {
      schedule: updatedData.schedule,
      days: updatedData.days,
      building: updatedData.building,
      classroom: updatedData.classroom,
      code: updatedData.code,
      course: updatedData.course,
      date: updatedData.date,
      duration: updatedData.duration,
      professor: updatedData.professor,
    };
    currentData.data[index] = orderedReservation;

    await fs.writeFile(filePath, JSON.stringify(currentData, null, 2), 'utf-8');

    res.json({ message: 'Reserva actualizada con éxito' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Archivo no encontrado para: ${cycle} - ${buildingName}`);
      return res.status(404).json({ message: 'No hay reservas para este ciclo y edificio' });
    }

    console.error("Error al actualizar la reserva:", error.message);
    res.status(500).json({ error: 'Error interno al actualizar la reserva' });
  }
};


//
// OBTENER RESERVAS
//
const getReservations = async (req, res) => {
  const { cycle, buildingName } = req.query;

  if (!cycle || !buildingName) {
    return res.status(400).json({ error: 'No se recibió el ciclo, el edificio o ambos' });
  }

  const filePath = path.join(__dirname, `../data/reservations/${cycle}/${buildingName}.json`);

  try {
    const data = await fs.readFile(filePath, 'utf8');
    const localSchedule = JSON.parse(data);
    res.json(localSchedule);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Archivo de reservas no encontrado para: ${cycle} - ${buildingName}`);
      return res.status(404).json({ message: 'No hay reservas para este ciclo y edificio' });
    }

    console.error('Error al leer la reserva:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar las reservas' });
  }
};


module.exports = {
  saveReservation,
  deleteReservation,
  updateReservation,
  getReservations,
};
