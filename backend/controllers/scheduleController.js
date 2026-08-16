const { scrapeData } = require('../scraper/schedules'); 

const getSchedule = async (req, res) => {
  const { cycle } = req.query;

  if (!cycle) {
    return res.status(400).json({ error: "Falta el parámetro 'cycle'" });
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