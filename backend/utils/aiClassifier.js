const natural = require('natural');
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');
const { preprocess, weakSet, hardSet } = require('./preProcess');

const categoryClassifier = new natural.BayesClassifier();
const priorityClassifier = new natural.BayesClassifier();

const categoryModelPath = path.join(__dirname, '../config/training/categoryClassifier.json');
const priorityModelPath = path.join(__dirname, '../config/training/priorityClassifier.json');

// Entrenamiento desde la base de datos
async function trainFromDatabase() {
  try {
    categoryClassifier.docs = [];
    priorityClassifier.docs = [];

    // ENTRENAMIENTO DE CATEGORÍAS
    const catResult = await pool.query(`
      SELECT report, category
      FROM tickets
      WHERE category IS NOT NULL
    `);

    function extractSecondaryCategory(category) {
      const match = category.match(/\((.*?)\)/);
      return match ? match[1] : category;
    }

    catResult.rows.forEach(({ report, category }) => {
      if (report && category) {
        const cleanCategory = extractSecondaryCategory(category.toLowerCase());
        const cleanReport = preprocess(report);
        categoryClassifier.addDocument(cleanReport, cleanCategory);
      }
    });

    if (categoryClassifier.docs.length > 0) {
      categoryClassifier.train();
      await new Promise((resolve, reject) => {
        categoryClassifier.save(categoryModelPath, err => err ? reject(err) : resolve());
      });
    }

    // ENTRENAMIENTO DE PRIORIDADES
    const priResult = await pool.query(`
      SELECT building, room, title, report, priority
      FROM tickets
      WHERE priority IS NOT NULL
    `);

    priResult.rows.forEach(({ building, room, title, report, priority }) => {
      const rawText = `${building} ${room || ''} ${title || ''} ${report}`;
      const cleanText = preprocess(rawText);
      if (cleanText && priority) {
        priorityClassifier.addDocument(cleanText, priority.toLowerCase());
      }
    });

    if (priorityClassifier.docs.length > 0) {
      priorityClassifier.train();
      await new Promise((resolve, reject) => {
        priorityClassifier.save(priorityModelPath, err => err ? reject(err) : resolve());
      });
    }

    console.log('Clasificadores entrenados y guardados.');
  } catch (error) {
    console.error('Error entrenando clasificadores:', error);
  }
}

// Cargar clasificadores desde disco
function loadModel(path) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path)) {
      resolve(null);
      return;
    }
    natural.BayesClassifier.load(path, null, (err, classifier) => {
      if (err) reject(err);
      else resolve(classifier);
    });
  });
}

// Carga ambos clasificadores desde disco
async function loadModelsFromDisk() {
  try {
    const catClassifier = await loadModel(categoryModelPath);
    if (catClassifier) {
      Object.assign(categoryClassifier, catClassifier);
    } else {
      console.log('categoryClassifier no encontrado.');
    }

    const priClassifier = await loadModel(priorityModelPath);
    if (priClassifier) {
      Object.assign(priorityClassifier, priClassifier);
    } else {
      console.log('priorityClassifier no encontrado.');
    }

    console.log('Clasificadores cargados desde disco.');
  } catch (err) {
    console.error('Error cargando clasificadores:', err);
  }
}

// Capitaliza el primer carácter
function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Clasifica un ticket en categoría y prioridad
function classifyTicket({ building, room, title, report }) {
  const fullText = `${building} ${room || ''} ${title || ''} ${report}`;
  const combinedText = `${title} ${report}`;
  const cleanReport = preprocess(report);
  const cleanFull = preprocess(fullText);
  const cleanCombined = preprocess(combinedText);

  const meaningfulTokens = cleanCombined.split(/\s+/).filter(token => {
    return !hardSet.has(token) && !weakSet.has(token);
  });

  // Si no existen palabras utiles entonces retorna un ticket sin clasificar
  if (meaningfulTokens.length < 4) {
    return {
      category: 'Sin categoria',
      secondaryCategory: null,
      priority: 'Baja'
    };
  }

  let rawCategory, rawPriority;
  try {
    rawCategory = categoryClassifier.classify(cleanReport);
  } catch { rawCategory = null; }

  try {
    rawPriority = priorityClassifier.classify(cleanFull);
  } catch { rawPriority = 'Baja'; }

  // Si el clasificador no devuelve nada valido retornamos un ticket sin clasificar
  if (!rawCategory || !['tecnico', 'software', 'hardware', 'limpieza', 'mantenimiento'].includes(rawCategory)) {
    return {
      category: 'Sin categoria',
      secondaryCategory: null,
      priority: capitalizeFirstLetter(rawPriority)
    };
  }

  let category = rawCategory;
  let secondaryCategory = null;

  if (rawCategory === 'software' || rawCategory === 'hardware') {
    category = 'tecnico';
    secondaryCategory = rawCategory;
  }

  category = capitalizeFirstLetter(category);
  secondaryCategory = secondaryCategory ? capitalizeFirstLetter(secondaryCategory) : null;
  const priority = capitalizeFirstLetter(rawPriority);

  return { category, secondaryCategory, priority };
}

module.exports = {
  trainFromDatabase,
  loadModelsFromDisk,
  classifyTicket
};
