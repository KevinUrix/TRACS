const { scrapeData } = require('../scraper/schedules');

const getSchedule = async (req, res) => {
  const { cycle, buildingName } = req.query;

  if (!cycle || !buildingName) {
    return res.status(400).json({ error: "Faltan parámetros 'cycle' o 'buildingName'" });
  }

  try {
    const data = await scrapeData(cycle, buildingName);
    return res.json({ [buildingName]: data });
  } catch (error) {
    console.error('Error al obtener los datos:', error.message);
    return res.status(500).json({ error: "Error al obtener los datos" });
  }
};

module.exports = { getSchedule };
