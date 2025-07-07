const express = require('express');
const router = express.Router();
const { trainFromDatabase } = require('../utils/aiClassifier');

router.post('/train-ia', async (req, res) => {
  try {
    await trainFromDatabase();
    res.json({ message: 'Modelos entrenados correctamente desde la base de datos.' });
  } catch (err) {
    console.error('Error al entrenar modelos:', err);
    res.status(500).json({ error: 'Error al entrenar modelos.' });
  }
});

module.exports = router;
