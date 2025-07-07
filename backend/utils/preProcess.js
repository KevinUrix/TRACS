const natural = require('natural');
const stemmer = natural.PorterStemmerEs;

const hardStopwords = [
  "el", "la", "los", "las", "un", "una", "unos", "unas",
  "de", "del", "al", "y", "o", "u", "en", "con", "sin",
  "por", "para", "a", "ante", "bajo", "cabe", "contra",
  "desde", "hacia", "hasta", "mediante",
  "segun", "sobre", "tras", "que", "como", "cuando", "donde",
  "quien", "cual", "cuales", "cuyo", "cuyos", "cuya", "cuyas",
  "lo", "se", "su", "sus", "mi", "mis", "tu", "tus", "nuestro", "nuestra",
  "nosotros", "vosotros", "ellos", "ellas", "usted", "ustedes",
  "yo", "tu", "el", "ella", "nos", "os", "me", "te", "le", "les",
  "es", "era", "fue", "son", "ser", "soy", "eres", "estoy", "esta", "estan", "estamos"
];

const weakStopwords = [
  // Intensificadores, cuantificadores, afirmaciones, negaciones
  "muy", "ya", "aun", "todavia", "solo", "solamente", "si", "no",
  "poco", "mas", "menos", "tambien", "tampoco", "incluso",
  "entonces", "ademas", "luego", "asi", "quiza", "quizas",
  "casi", "aunque", "mismo", "bien", "mal", "mucho", "bastante",
  "demasiado",

  // Peticiones humanas y expresiones comunes
  "ayuda", "necesito", "requiero", "requiere", "pido", "quiero",
  "solicito", "solicita", "presenta", "presento", "presento",
  "porfavor", "porfa", "favor", "hay"
];

// Deja el texto limpio para el entrenamiento/clasificación
const weakSet = new Set(weakStopwords);
const hardSet = new Set(hardStopwords);

function preprocess(text) {
  let tokens = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")     // Elimina acentos
    .split(/\s+/)                         // Divide por palabras
    .map(word => word.replace(/[^a-z0-9]/g, '')) // Elimina signos de cada palabra
    .filter(word => word && !/^\d+$/.test(word)) // Elimina vacíos y números solos

    // Aplica stemming solo si NO está en palabras protegidas
    tokens = tokens.map(word => {
      if (protectedWords.has(word)) return word;
      return stemmer.stem(word); // Aplica stemming
    });

  // Filtro de stopwords
  tokens = tokens.filter((word, _, arr) => {
    if (hardSet.has(word)) return false;
    if (weakSet.has(word)) {
      const hasContext = arr.some(w => w !== word && !weakSet.has(w) && !hardSet.has(w));
      return hasContext;
    }
    return true;
  });

  return tokens.join(' ');
}

module.exports = preprocess;
