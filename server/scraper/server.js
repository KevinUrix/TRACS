const express = require('express');
const cors = require('cors');
const scheduleRoutes = require('../routes/scheduleRoutes');
const downloadRoutes = require('../routes/downloadRoutes');
const searchRoutes = require('../routes/searchRoutes');
const reservationsRoutes = require('../routes/reservationsRoutes')
const classroomsRoutes = require('../routes/classroomsRoutes');
const localScheduleRoutes = require( '../routes/localScheduleRoutes');
const cyclesRoutes = require( '../routes/cyclesRoutes');
const buildingsRoutes = require( '../routes/buildingsRoutes');
const googleAuthRoutes = require('../routes/googleAuthRoutes');

const app = express();
const PORT = process.env.PORT || 3001;
require('dotenv').config();

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

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
