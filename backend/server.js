const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const { Server } = require('socket.io');
require('dotenv').config();

const { initNotifier } = require('./utils/notifier');
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
const notificationsRoutes = require('./routes/notificationsRoutes');

//Cache
const redis = require('./utils/redisClient');
const cache = require('./scraper/cache');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'https://www.tracs.cloud',
      'http://localhost:3001',
      'https://johnafleming.cucei.udg.mx'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
initNotifier(io);

const PORT = process.env.BACKEND_PORT || 3001;

// Middlewares
app.use(cors({
  origin: ['https://www.tracs.cloud', 'http://localhost:3001', 'https://johnafleming.cucei.udg.mx'], // Cambiaremos esto cuando se requiera en CUCEI
  credentials: true,
}));
app.use(express.json());
app.use(helmet());

// Rutas
app.use('/desarrollo/tracs/api', scheduleRoutes);
app.use('/desarrollo/tracs/api', downloadRoutes);
app.use('/desarrollo/tracs/api', searchRoutes);
app.use('/desarrollo/tracs/api', reservationsRoutes);
app.use('/desarrollo/tracs/api', classroomsRoutes);
app.use('/desarrollo/tracs/api', localScheduleRoutes);
app.use('/desarrollo/tracs/api', cyclesRoutes);
app.use('/desarrollo/tracs/api', buildingsRoutes);
app.use('/desarrollo/tracs/api/google', googleAuthRoutes);
app.use('/desarrollo/tracs/api', trainRoutes);
app.use('/desarrollo/tracs/api', notificationsRoutes);

/*---------------- SQL -----------------------*/
app.use('/desarrollo/tracs/api', userRoutes);
app.use('/desarrollo/tracs/api/tickets', ticketRoutes);

// Host - build
const buildPath = path.join(__dirname, '..', 'build');
app.use('/desarrollo/tracs', express.static(buildPath));

app.get('/desarrollo/tracs', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.get('/desarrollo/tracs/privacy', (req, res) => {
  res.sendFile(path.join(buildPath, 'privacy.html'));
});

app.get('/desarrollo/tracs/terms', (req, res) => {
  res.sendFile(path.join(buildPath, 'terms.html'));
});

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