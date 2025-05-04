const fs = require('fs').promises;
const path = require('path');
const { getOAuth2Client } = require('../utils/googleOAuthClient');
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
    // Leer archivo actual (si existe)
    let currentData = { data: [] };
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      if (fileContent.trim()) {
        const parsed = JSON.parse(fileContent);
        currentData.data = Array.isArray(parsed.data) ? parsed.data : [];
      }
    } catch (readErr) {
      console.warn('Archivo inexistente o corrupto, se inicializa vacío');
    }

    // Crear evento en Google Calendar si corresponde
    if (reservationData.createInGoogleCalendar) {
      try {
        const oAuth2Client = await getOAuth2Client();
        const tokens = oAuth2Client.credentials;

        if (!tokens || !tokens.access_token) {
          console.warn('Usuario no autenticado en Google, no se crea evento');
        } else {
          const googleEventId = await createGoogleEvent(reservationData, tokens);
          if (googleEventId) {
            reservationData.googleEventId = googleEventId;
            console.log('Evento creado en Google Calendar:', googleEventId);
          }
        }
      } catch (calendarErr) {
        console.error('Error al crear evento en Google Calendar:', calendarErr);
        // No se interrumpe la reserva si Google falla
      }
    }

    // Guardar reserva
    currentData.data.push(reservationData);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(currentData, null, 2));

    res.status(201).json({
      message: 'Reserva guardada con éxito',
      googleEventId: reservationData.googleEventId || null,
    });
  } catch (error) {
    console.error('Error al guardar reserva:', error);
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
