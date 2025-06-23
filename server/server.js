const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

const { loadModelsFromDisk, trainFromDatabase } = require('./utils/aiClassifier');
const scheduleRoutes = require('./routes/scheduleRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const searchRoutes = require('./routes/searchRoutes');
const reservationsRoutes = require('./routes/reservationsRoutes')
const classroomsRoutes = require('./routes/classroomsRoutes');
const localScheduleRoutes = require( './routes/localScheduleRoutes');
const cyclesRoutes = require( './routes/cyclesRoutes');
const buildingsRoutes = require( './routes/buildingsRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const trainRoutes = require('./routes/trainRoutes');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.BACKEND_PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', scheduleRoutes);
app.use('/api', downloadRoutes);
app.use('/api', searchRoutes);
app.use('/api', reservationsRoutes);
app.use('/api', classroomsRoutes);
app.use('/api', localScheduleRoutes);
app.use('/api', cyclesRoutes);
app.use('/api', buildingsRoutes);
app.use('/api/google', googleAuthRoutes);
app.use('/api', trainRoutes);

/*---------------- SQL -----------------------*/
app.use('/api', userRoutes);
app.use('/api/tickets', ticketRoutes);

// Host - build
const buildPath = path.join(__dirname, '..', 'build');
app.use(express.static(buildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

(async () => {
  // await trainFromDatabase();
  await loadModelsFromDisk();
  
  server.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  });
})();