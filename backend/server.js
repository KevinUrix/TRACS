const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const helmet = require('helmet');

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

//Cache
const redis = require('./utils/redisClient');
const cache = require('./scraper/cache');

const app = express();
const server = http.createServer(app);

const PORT = process.env.BACKEND_PORT || 3001;

// Middlewares
app.use(cors({
  origin: ['https://www.tracs.cloud', 'http://localhost:3000', 'http://johnafleming.cucei.udg.mx'], // Cambiaremos esto cuando se requiera en CUCEI
}));
app.use(express.json());
app.use(helmet());

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
app.use('/desarrollo/tracs', express.static(buildPath));

app.get('/desarrollo/tracs/*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});


// Sincroniza el caché local (node) con redis si redis llegó a fallar
redis.on('ready', () => {
  console.log('Redis listo. Sincronizando localCache...');
  cache.syncLocalCacheToRedis()
    .then(() => console.log('Sincronización finalizada'))
    .catch(err => console.error('Error durante la sincronización:', err.message));
});


(async () => {
  // await trainFromDatabase();
  // await loadModelsFromDisk();
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo`);
  });
})();