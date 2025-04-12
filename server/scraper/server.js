const express = require('express');
const cors = require('cors');  // Importa el módulo cors
const { scrapeData } = require('./schedules');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());  // Esto habilita CORS para todas las rutas

app.use(express.json());

app.get('/api/schedule', async (req, res) => {
  const { cycle, buildingName } = req.query;

  if (!cycle || !buildingName) {
    return res.status(400).json({ error: "Faltan parámetros 'cycle' o 'buildingName'" });
  }

  console.log(cycle, buildingName);

  try {
    const data = await scrapeData(cycle, buildingName);
    res.json({ [buildingName]: data });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los datos" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
