const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const { getOAuth2Client } = require('../utils/googleOAuthClient');
const { createGoogleEvent } = require('../utils/createGoogleEvent');

const mapBuildingName = (name) => {
  if (name === 'DUCT1') return 'Alfa';
  if (name === 'DUCT2') return 'Beta';
  if (name === 'DBETA') return 'CISCO';
  return name;
};

//
// GUARDAR RESERVAS
//
const saveReservation = async (req, res) => {
  const { cycle, buildingName } = req.query;
  const mappedBuildingName = mapBuildingName(buildingName);
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

    // Verifica duplicados por fecha, horario y salón
    const alreadyExists = currentData.data.find(res => {
      const sameDate = res.date?.trim() === reservationData.date?.trim();
      const sameSchedule = res.schedule?.trim() === reservationData.schedule?.trim();
      const sameClassroom = res.classroom?.trim().toUpperCase() === reservationData.classroom?.trim().toUpperCase();

      const isDuplicate = sameDate && sameSchedule && sameClassroom;

      if (isDuplicate) {
        console.warn('Reserva duplicada detectada:', {
          existente: res,
          nueva: reservationData
        });
      }

      return isDuplicate;
    });

    if (alreadyExists) {
      return res.status(409).json({
        error: 'Ya existe una reserva para esta fecha, horario y aula',
      });
    }


    // Crea evento en Google Calendar si corresponde
    if (reservationData.createInGoogleCalendar) {
      try {
        const oAuth2Client = await getOAuth2Client();
        const tokens = oAuth2Client.credentials;

        if (!tokens || !tokens.access_token) {
          console.warn('Usuario no autenticado en Google, no se crea evento');
        } else {
          const googleEventId = await createGoogleEvent(reservationData, tokens, mappedBuildingName);
          if (googleEventId) {
            reservationData.googleEventId = googleEventId;
            console.log('Evento creado en Google Calendar:', googleEventId);
          }
        }
      } catch (calendarErr) {
        console.error('Error al crear evento en Google Calendar:', calendarErr);
        // No se interrumpe la reserva si Google falla
        return res.status(500).json({ error: 'No se pudo crear evento en Google Calendar' });
      }
    }

    // Guardamos la reserva
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
  const mappedBuildingName = mapBuildingName(buildingName);
  const filePath = path.join(__dirname, `../data/reservations/${cycle}/${buildingName}.json`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    let currentData = JSON.parse(fileContent);

    if (!Array.isArray(currentData.data)) {
      currentData.data = [];
    }

    // Busca las reservas a eliminar
    const toDelete = currentData.data.filter(reservation =>
      reservation.schedule === schedule &&
      reservation.building === buildingName &&
      reservation.date === date &&
      reservation.professor === professor
    );

    // Si hay eventos para borrar en Google Calendar
    if (toDelete.length > 0) {
      try {
        const oAuth2Client = await getOAuth2Client();
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        // Obtener lista de calendarios
        const calendarListResponse = await calendar.calendarList.list();
        const calendars = calendarListResponse.data.items || [];

        // Buscar calendario que contenga buildingName en su nombre
        const targetCalendar = calendars.find(cal =>
          cal.summary.toLowerCase().includes(mappedBuildingName.toLowerCase())
        );
        const calendarId = targetCalendar ? targetCalendar.id : 'primary';

        for (const reservation of toDelete) {
          if (reservation.googleEventId) {
            try {
              await calendar.events.delete({
                calendarId,
                eventId: reservation.googleEventId,
              });
              console.log(`Evento ${reservation.googleEventId} eliminado de Google Calendar`);
            } catch (err) {
              console.warn(`No se pudo eliminar el evento ${reservation.googleEventId}:`, err.message);
            }
          }
        }

      } catch (err) {
        console.warn('No se pudo autenticar con Google para eliminar eventos:', err.message);
      }
    }

    // Filtrar las reservas que NO coinciden (las que se deben conservar)
    currentData.data = currentData.data.filter(reservation =>
      !(
        reservation.schedule === schedule &&
        reservation.building === buildingName &&
        reservation.date === date &&
        reservation.professor === professor
      )
    );

    await fs.writeFile(filePath, JSON.stringify(currentData, null, 2));
    res.json({ message: 'Reserva(s) eliminada(s) con éxito' });

  } catch (error) {
    if (error.code === 'ENOENT') {
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
  const { cycle, buildingName, originalProfessor, originalSchedule, originalDate, originalGoogleEventId } = req.query;
  const mappedBuildingName = mapBuildingName(buildingName);

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
      createInGoogleCalendar: updatedData.createInGoogleCalendar,
    };

    if (originalGoogleEventId)
      orderedReservation.googleEventId = originalGoogleEventId;

    currentData.data[index] = orderedReservation;

    await fs.writeFile(filePath, JSON.stringify(currentData, null, 2), 'utf-8');

    // Actualiza evento en Google Calendar si se existe el ID del evento
    if (originalGoogleEventId) {
      try {
        const oAuth2Client = await getOAuth2Client();
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        const [startRaw, endRaw] = updatedData.schedule.split('-');
        const startHour = `${startRaw.slice(0, 2)}:${startRaw.slice(2, 4)}`;
        const endHour = `${endRaw.slice(0, 2)}:${endRaw.slice(2, 4)}`;

        const startDateTime = new Date(`${updatedData.date}T${startHour}:00`);
        const endDateTime = new Date(`${updatedData.date}T${endHour}:00`);

        if (isNaN(startDateTime) || isNaN(endDateTime)) {
          throw new Error('Fechas de inicio o fin inválidas');
        }


        const event = {
          summary: updatedData.professor,
          location: `${updatedData.building} ${updatedData.classroom}`,
          description: `Materia: ${updatedData.course}\nClave: ${updatedData.code}`,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'America/Mexico_City',
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'America/Mexico_City',
          },
        };

        // Si la duración cambia a "Temporal", eliminamos la recurrencia
        if (updatedData.duration !== 'Siempre') {
          event.recurrence = [];  // Eliminar cualquier recurrencia previa
        } else if (updatedData.duration === 'Siempre' && updatedData.days) {
          // Si la duración sigue siendo "Siempre", añadimos la recurrencia semanal
          const dayMap = { L: 'MO', M: 'TU', I: 'WE', J: 'TH', V: 'FR', S: 'SA', D: 'SU' };

          // Convierte 'days' en un arreglo
          const daysArray = Array.isArray(updatedData.days) ? updatedData.days : updatedData.days.split('');
          const byDay = daysArray.map(d => dayMap[d]).join(',');

          // Calcula la fecha de finalización
          const endRecurrenceDate = new Date(startDateTime);
          endRecurrenceDate.setMonth(endRecurrenceDate.getMonth() + 4); // 4 meses de duración

          // Formatea la fecha de finalización en formato YYYYMMDD
          const untilDate = endRecurrenceDate.toISOString().split('T')[0].replace(/-/g, '');

          // Establece la recurrencia semanal
          event.recurrence = [
            `RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${untilDate}T000000Z`
          ];
        }

        // Obtener lista de calendarios
        const calendarListResponse = await calendar.calendarList.list();
        const calendars = calendarListResponse.data.items || [];

        // Buscar calendario que contenga buildingName en su nombre
        const targetCalendar = calendars.find(cal =>
          cal.summary.toLowerCase().includes(mappedBuildingName.toLowerCase())
        );
        const calendarId = targetCalendar ? targetCalendar.id : 'primary';

        await calendar.events.update({
          calendarId,
          eventId: originalGoogleEventId,
          resource: event,
        });


        console.log(`Evento ${originalGoogleEventId} actualizado en Google Calendar`);
      } catch (err) {
        console.warn(`No se pudo actualizar el evento ${originalGoogleEventId}:`, err.message);
      }
    }

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
