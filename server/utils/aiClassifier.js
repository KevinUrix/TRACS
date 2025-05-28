const natural = require('natural');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: 5432,
});

const categoryClassifier = new natural.BayesClassifier();
const priorityClassifier = new natural.BayesClassifier();

const categoryModelPath = path.join(__dirname, '../config/training/categoryClassifier.json');
const priorityModelPath = path.join(__dirname, '../config/training/priorityClassifier.json');

// Entrenamiento desde la base de datos
async function trainFromDatabase() {
  try {
    categoryClassifier.docs = [];
    priorityClassifier.docs = [];

    const catResult = await pool.query('SELECT report, category FROM tickets WHERE category IS NOT NULL');
    catResult.rows.forEach(({ report, category }) => {
      if (report && category) {
        categoryClassifier.addDocument(report.toLowerCase(), category);
      }
    });
    categoryClassifier.train();
    await new Promise((resolve, reject) => {
      categoryClassifier.save(categoryModelPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const priResult = await pool.query('SELECT building, room, title, report, priority FROM tickets WHERE priority IS NOT NULL');
    priResult.rows.forEach(({ building, room, title, report, priority }) => {
      const combined = `${building} ${room || ''} ${title || ''} ${report}`.toLowerCase();
      if (combined && priority) {
        priorityClassifier.addDocument(combined, priority);
      }
    });
    priorityClassifier.train();
    await new Promise((resolve, reject) => {
      priorityClassifier.save(priorityModelPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

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



async function loadModelsFromDisk() {
  try {
    const catClassifier = await loadModel(categoryModelPath);
    if (catClassifier) {
      categoryClassifier.docs = catClassifier.docs;
      Object.assign(categoryClassifier, catClassifier);
    } else {
      console.log('categoryClassifier no encontrado.');
    }

    const priClassifier = await loadModel(priorityModelPath);
    if (priClassifier) {
      priorityClassifier.docs = priClassifier.docs;
      Object.assign(priorityClassifier, priClassifier);
    } else {
      console.log('priorityClassifier no encontrado.');
    }

    console.log('Clasificadores cargados desde disco.');
  } catch (err) {
    console.error('Error cargando clasificadores:', err);
  }
}


function classifyTicket({ building, room, title, report }) {
  const text = `${building} ${room || ''} ${title || ''} ${report}`.toLowerCase();
  const category = categoryClassifier.classify(report.toLowerCase());
  const priority = priorityClassifier.classify(text);
  return { category, priority };
}

module.exports = {
  trainFromDatabase,
  loadModelsFromDisk,
  classifyTicket
};
