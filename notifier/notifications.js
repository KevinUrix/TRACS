const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || process.env.SOCKET_PORT || 3002;

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
  console.log('Cliente conectado al microservicio');
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});


server.listen(PORT, '0.0.0.0', () => {
  console.log(`Microservicio de notificaciones activo en puerto ${PORT}`);
});
