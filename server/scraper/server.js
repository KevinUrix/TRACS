const express = require('express');
const cors = require('cors');
const scheduleRoutes = require('../routes/scheduleRoutes');
const downloadRoutes = require('../routes/downloadRoutes');
const searchRoutes = require('../routes/searchRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', scheduleRoutes);
app.use('/api', downloadRoutes);
app.use('/api', searchRoutes);

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
