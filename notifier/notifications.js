const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const PORT = process.env.PORT || process.env.SOCKET_PORT || 3002;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['https://tracs-cucei.vercel.app', 'http://localhost:3000'], // Cambiaremos esto cuando se requiera en CUCEI
    methods: ['GET', 'POST']
  }
});

app.use(express.json());
const allowedEvents = ['new-reservation', 'new-ticket'];

// Endpoint para recibir notificaciones
app.post('/notify', (req, res) => {
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


  io.emit(type, data);  // Emitimos evento a los clientes
  console.log(`[NOTIFY] Emitido evento '${type}'`);
  res.json({ message: 'Notificación enviada' });
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
