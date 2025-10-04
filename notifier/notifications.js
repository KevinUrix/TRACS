require('dotenv').config();
const cors = require('cors');
const express = require('express');
const http = require('http');
const { pool } = require('./db');
const { Server } = require('socket.io');

const PORT = process.env.PORT || process.env.SOCKET_PORT || 3002;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['https://www.tracs.cloud', 'http://localhost:3000',  'http://johnafleming.cucei.udg.mx'], // Cambiaremos esto cuando se requiera en CUCEI
    methods: ['GET', 'POST']
  }
});

app.use(express.json());

app.use(cors({
  origin: ['http://localhost:3000', 'https://www.tracs.cloud', 'http://johnafleming.cucei.udg.mx'], // Cambiaremos esto cuando se requiera en CUCEI.También crear la rama.
  methods: ['GET', 'POST'],
  credentials: true,
}));


/* SERVICIO: EN CASO DE CREAR MÁS EVENTOS SE PONEN AQUÍ */
const allowedEvents = ['new-reservation', 'new-ticket'];


/* ENDPOINT PARA RECIBIR NOTIFICACIONES */
app.post('/notify', async (req, res) => {
  const { type, data } = req.body;
  const auth = req.headers.authorization;

  if (auth !== `Bearer ${process.env.NOTIFY_TOKEN}`) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  if (!type || !data) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  if (!allowedEvents.includes(type)) {
    return res.status(400).json({ error: 'Tipo de evento no permitido' });
  }

  try {
    // La notificación se guarda en la BD
    const result = await pool.query(
      'INSERT INTO notifications (type, payload) VALUES ($1, $2) RETURNING id',
      [type, data]
    );

    const notificationId = result.rows[0].id;

    io.emit(type, { id: notificationId, payload: data });

    console.log(`[NOTIFY] Emitido evento '${type}' y guardado en BD`);

    res.json({ message: 'Notificación enviada' });
  } catch (err) {
    console.error('Error al guardar notificación:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});


/* GUARDA LAS NOTIFICACIONES EN LA BD */
app.get('/notifications', async (req, res) => {
  const userId = req.query.user;
  const maxDays = parseInt(req.query.maxDays || '30', 10);


  if (userId === undefined || userId === null ) return res.status(400).json({ error: 'Falta userId' });

  try {
    await pool.query(
      `
      UPDATE notifications SET seen_by = array_append(seen_by, $1) WHERE created_at < NOW() - ($2 || ' days')::interval AND NOT $1 = ANY(seen_by)
      `,
      [userId, maxDays]
    );

    const result = await pool.query(
      `
      SELECT * FROM notifications WHERE NOT $1 = ANY(seen_by) AND created_at >= NOW() - ($2 || ' days')::interval ORDER BY created_at ASC
      `,
      [userId, maxDays]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener notificaciones:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});


/* MARCA COMO LEÍDAS LAS NOTIFICACIONES LUEGO DE QUE SE CIERRE LOS TOASTER */
app.post('/notifications/mark-read', async (req, res) => {
  const { userId, ids } = req.body;

  if (userId === undefined || userId === null || !ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  try {
    await pool.query(
      `UPDATE notifications 
      SET seen_by = array_append(seen_by, $1) 
      WHERE id = ANY($2::int[]) AND NOT $1 = ANY(seen_by)`,
      [userId, ids]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Error al marcar notificaciones:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});


io.on('connection', (socket) => {
  console.log('Cliente conectado al microservicio');
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});


server.listen(PORT, '0.0.0.0', () => {
  console.log(`Microservicio de notificaciones activo en puerto ${PORT}`);
});
