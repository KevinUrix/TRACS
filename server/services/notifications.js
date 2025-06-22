const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());

// Endpoint para recibir notificaciones
app.post('/notify', (req, res) => {
  const { type, data } = req.body;

  if (!type || !data) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  io.emit(type, data);  // Emitimos evento a los clientes
  console.log(`[NOTIFY] Emitido evento '${type}'`);
  res.json({ message: 'Notificación enviada' });
});

io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado al microservicio');
});

server.listen(3002, '0.0.0.0', () => {
  console.log('✅ Microservicio de notificaciones activo en puerto 3002');
});
