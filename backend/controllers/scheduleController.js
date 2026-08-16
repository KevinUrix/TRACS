const { scrapeData } = require('../scraper/schedules');

const validateCycle = (cycle) => {
  if (!cycle || typeof cycle !== 'string') return false;
  return /^[A-Z0-9]{3,8}$/.test(cycle.trim());
};

const getSchedule = async (req, res) => {
  const { cycle } = req.query;

  if (!cycle) {
    return res.status(400).json({ error: "Falta el parámetro 'cycle'" });
  }

  if (!validateCycle(cycle)) {
    return res.status(400).json({ error: 'Ciclo inválido' });
  }

  try {
    const result = await scrapeData(cycle);
    if (result.error) {
        return res.status(500).json({ error: "Error al consultar SIIAU" });
    }
    return res.json({ data: result.data });
  } catch (error) {
    console.error('Error al obtener los datos:', error.message);
    return res.status(500).json({ error: "Error al obtener los datos" });
  }
};

module.exports = { getSchedule };