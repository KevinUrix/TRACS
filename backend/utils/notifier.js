const { pool } = require('./db');

let io = null;

function initNotifier(ioInstance) {
  io = ioInstance;

  io.on('connection', (socket) => {
    console.log('[NOTIFIER] Cliente conectado.');

    socket.on('disconnect', () => {
      console.log('[NOTIFIER] Cliente desconectado.');
    });
  });
}

const allowedEvents = ['new-reservation', 'new-ticket'];

async function notify(type, data) {
  if (!allowedEvents.includes(type)) {
    console.warn(`[NOTIFY] Tipo de evento no permitido: '${type}'`);
    return;
  }

  if (!io) {
    console.warn('[NOTIFY] Socket.IO no inicializado');
    return;
  }

  try {
    const result = await pool.query(
      'INSERT INTO notifications (type, payload) VALUES ($1, $2) RETURNING id',
      [type, data]
    );

    const notificationId = result.rows[0].id;

    io.emit(type, { id: notificationId, payload: data });

    console.log(`[NOTIFY] Emitido evento '${type}' y guardado en BD.`);
  } catch (err) {
    console.error('Error al guardar/emitar notificación:', err.message);
  }
}

module.exports = { initNotifier, notify };