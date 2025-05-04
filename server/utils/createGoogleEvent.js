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
    return null;
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
  if (reservationData.duration === 'Siempre' && reservationData.days) {
    const dayMap = { L: 'MO', M: 'TU', I: 'WE', J: 'TH', V: 'FR', S: 'SA', D: 'SU' };

    // Convierte 'days' en un arreglo
    const daysArray = Array.isArray(reservationData.days) ? reservationData.days : reservationData.days.split('');
    const byDay = daysArray.map(d => dayMap[d]).join(',');

    // Calcula la fecha de finalización
    const startDateTime = new Date(`${reservationData.date}T${startHour}:00`);
    const endRecurrenceDate = new Date(startDateTime);
    endRecurrenceDate.setMonth(endRecurrenceDate.getMonth() + 4); // 4 meses de duración

    // Formatea la fecha de finalización en formato YYYYMMDD
    const untilDate = endRecurrenceDate.toISOString().split('T')[0].replace(/-/g, '');

    // Establece la recurrencia semanal
    event.recurrence = [
      `RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${untilDate}T000000Z`
    ];
  }

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    return res.data.id;
  } catch (error) {
    console.error('Error al crear el evento en Google Calendar:', error);
    throw error;
  }
};

module.exports = { createGoogleEvent };
