const { searchProfessor } = require('../scraper/search');

const normalizeName = (name) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, '')   // quita las tildes
    .replace(/[^a-z\sñ]/g, '')         // permite letras, espacios y ñ
    .replace(/\s+/g, ' ')              // reduce espacios múltiples
    .trim();
};

const matchesName = (fullName, normalizedQuery) => {
  // Si el query normalizado queda vacío, no hace match
  if (!normalizedQuery) return false;
  return normalizedQuery
    .split(' ')
    .every(q => fullName.includes(q));
};

const getSearch = async (req, res) => {
  const professorName = req.query.name;
  const cycle = req.query.cycle;
  const building = req.query.buildingName || '';
  console.log(professorName, cycle, building);

  if (!professorName || !cycle) {
    return res.status(400).json({ error: 'Faltan parámetros: name y cycle son requeridos' });
  }

  const normalizedQuery = normalizeName(professorName);
  if (!normalizedQuery) {
    return res.status(400).json({ error: 'Término de búsqueda inválido' });
  }

  try {
    const data = await searchProfessor(cycle);
    const results = data.filter(item => {
      const normalizedFullName = normalizeName(item.professor);
      return matchesName(normalizedFullName, normalizedQuery);
    });

    // Si se recibe un edificio, primero coloca esos resultados
    if (building) {
      results.sort((a, b) => {
        const aInBuilding = a.data.building === building ? -1 : 1;
        const bInBuilding = b.data.building === building ? -1 : 1;
        return aInBuilding - bInBuilding;
      });
    }

    res.json(results);
  } catch (error) {
    console.error("Error en la búsqueda de profesor:", error.message);
    res.status(500).json({ error: 'Error interno al buscar profesor' });
  }
};

module.exports = { getSearch };