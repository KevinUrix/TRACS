const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const formatTime = (timeStr) => {
  // Convierte "0700" a "07:00"
  return `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`;
};

const createGoogleEvent = async (reservationData, tokens) => {
  if (!tokens) {
    throw new Error('No se encontraron tokens de Google');
  }

  if (reservationData.createInGoogleCalendar !== 'true') {
    return res.status(200).json({ message: 'Reserva creada localmente. No se añadió a Google Calendar.' });
  }

  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials(tokens);

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const [startRaw, endRaw] = reservationData.schedule.split('-');
  const startHour = formatTime(startRaw);
  const endHour = formatTime(endRaw);

  const event = {
    summary: reservationData.professor,
    location: `${reservationData.building} ${reservationData.classroom}`,
    description: `Materia: ${reservationData.course}\nClave: ${reservationData.code}`,
    start: {
      dateTime: `${reservationData.date}T${startHour}:00`,
      timeZone: 'America/Mexico_City',
    },
    end: {
      dateTime: `${reservationData.date}T${endHour}:00`,
      timeZone: 'America/Mexico_City',
    },
  };

  // (Opcional) Recurrencia semanal si aplica
  if (reservationData.duration === 'Siempre' && Array.isArray(reservationData.days)) {
    const dayMap = {
      L: 'MO', M: 'TU', I: 'WE', J: 'TH', V: 'FR', S: 'SA', D: 'SU'
    };

    const byDay = reservationData.days.map(d => dayMap[d]).join(',');
    event.recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`];
  }

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    // console.log('Evento creado:', res.data);
    return res.data.id;
  } catch (error) {
    console.error('Error al crear el evento en Google Calendar:', error);
    throw error;
  }
};

module.exports = { createGoogleEvent };
