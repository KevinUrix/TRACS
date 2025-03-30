const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3030;

app.use(cors()); // Habilitar CORS para solicitudes desde el frontend (React)

app.get('/', async (req, res) => {

    fs.readFile(path.join(__dirname, '../data/selects/', 'cicles.json'), 'utf8', (err, data) => {
        if (err) {
        return res.status(500).json({ error: 'No se pudo leer el archivo JSON' });
        }
        // Envía el JSON como respuesta
        res.json(JSON.parse(data));
    });
});

app.listen(port, () => {
  console.log(`Servidor en ejecución en http://localhost:${port}`);
});
