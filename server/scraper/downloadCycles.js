const { scrapeCycles } = require('./cycles');
const fs = require('fs');
const path = require('path');

const saveCyclesToFile = async (outputDir = path.join(__dirname, '../data'), fileName = 'cycles.json') => {
  const filePath = path.join(outputDir, fileName);

  // Asegurar que el directorio existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    const cycles = await scrapeCycles();

    if (!Array.isArray(cycles) || cycles.length === 0) {
      console.warn('⚠️ Ciclos vacíos, no se guarda ningún archivo.');
      return { success: false, reason: 'empty' };
    }

    fs.writeFileSync(filePath, JSON.stringify(cycles, null, 2), 'utf-8');
    console.log(`✅ Ciclos guardados en: ${filePath}`);
    return { success: true };
  } catch (err) {
    console.error('❌ Error al guardar los ciclos:', err.message);
    return { success: false, reason: err.message };
  }
};

module.exports = { saveCyclesToFile };
