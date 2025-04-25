const { searchProfessor } = require('../scraper/search');

const normalizeName = (name) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, '')   // quitar tildes
    .replace(/[^a-z\sñ]/g, '')         // permitir letras, espacios y ñ
    .replace(/\s+/g, ' ')              // reducir espacios múltiples
    .trim();
};

const matchesName = (fullName, query) => {
  const normalizedFullName = normalizeName(fullName);
  const normalizedQuery = normalizeName(query);

  // Si el query normalizado queda vacío, no hace match
  if (!normalizedQuery) return false;

  return normalizedQuery
    .split(' ')
    .every(q => normalizedFullName.includes(q));
};

const getSearch = async (req, res) => {
  const professorName = req.query.name;
  const cycle = req.query.cycle;
  console.log(professorName, cycle);

  if (!professorName || !cycle) {
    return res.status(400).json({ error: 'Faltan parámetros: name y cycle son requeridos' });
  }

  // Verifica si el nombre es válido después de normalizar
  const normalizedQuery = normalizeName(professorName);
  if (!normalizedQuery) {
    return res.status(400).json({ error: 'Término de búsqueda inválido' });
  }

  try {
    const results = [];
    const data = await searchProfessor(cycle);
    const filtered = data.filter(item =>
      matchesName(item.professor, professorName)
    );
    results.push(...filtered);

    res.json(results);
  } catch (error) {
    console.error("Error en la búsqueda de profesor:", error.message);
    res.status(500).json({ error: 'Error interno al buscar profesor' });
  }
};


module.exports = { getSearch };

