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
  "es", "era", "fue", "son", "ser", "soy", "eres", "estoy", "esta", "estan", "estamos",
  "buenas", "tardes", "hola", "hello", "gracias", "buenos", "saludos", "atentamente",
  "despido", "esto", "segundo", "primero", "lejos", "acerca", "junto", "aqui", "ahi",
  "alguien", "algo", "ninguno", "ninguna", "ningunos", "ningunas", "todos", "todas",
  "muchos", "pocos", "hacer", "hacerlo", "haremos", "decir", "decimos", "dar", "damos",
  "daremos", "tener", "tenemos", "venir", "ver", "vemos", "oir", "oimos", "pensar", "saber",
  "creer", "estar", "seguir", "pienso", "sabemos", "ni", "pero", "porque", "siendo", "eso",
  "da"
];

const weakStopwords = [
  // Intensificadores, cuantificadores, afirmaciones, negaciones
  "muy", "ya", "aun", "todavia", "solo", "solamente", "si", "no",
  "poco", "mas", "menos", "tambien", "tampoco", "incluso",
  "entonces", "ademas", "luego", "asi", "quiza", "quizas",
  "casi", "aunque", "mismo", "bien", "mal", "mucho", "bastante",
  "demasiado",

  // Peticiones y expresiones comunes
  "ayuda", "necesito", "requiero", "requiere", "pido", "quiero",
  "solicito", "solicita", "presenta", "presento", "presento",
  "porfavor", "porfa", "favor", "hay",

  // Extras
  "señor", "señora", "maestra", "doctora", "doctor", "profesor", "profesora", "mtra", "mtro",
  "etc", "entre", "alrededor", "cerca", "fabuloso"
];

const protectedWords = [
  "bios", "ram", "rom", "cpu", "gpu", "hdd", "ssd", "usb", "hdmi", "vga",
  "monitor", "mouse", "teclado", "pantalla", "touchpad", "microfono",
  "parlante", "camara", "bateria", "cargador", "fuente", "placa",
  "motherboard", "disco", "gabinete", "sensor", "impresora",
  "escaner", "lector", "proyector", "wifi", "ethernet", "lan", "wan",
  "dns", "dhcp", "ip", "gateway", "router", "modem", "ping", "red", "proxy",
  "firewall", "vpn", "servidor", "hostname", "puerto", "mac", "windows",
  "linux", "ubuntu", "android", "ios", "office", "excel", "word",
  "powerpoint", "navegador", "chrome", "firefox", "edge", "outlook",
  "driver", "sistema", "update", "actualizacion", "formateo", "licencia",
  "instalador", "antivirus", "malware", "virus", "backup", "respaldo",
  "configuracion", "controladores", "pc", "laptop", "usuario", "password",
  "correo", "email", "cuenta", "sesion", "ticket", "soporte", "app",
  "token", "id", "login", "logout", "api", "backend", "frontend", "clave",
  "contraseña", "otp", "autenticacion", "seguridad", "acceso", "permiso",
  "bloqueo", "captcha", "certificado", "cifrado", "switch", "rj45", "tv", "television"
];

const synonyms = {
  // Correo y comunicación
  "correo": "email",
  "correoelectronico": "email",
  "e-mail": "email",
  "mail": "email",
  "mensaje": "email",

  // Dispositivo
  "computadora": "pc",
  "ordenador": "pc",
  "portatil": "laptop",
  "notebook": "laptop",
  "equipo": "pc",
  "maquina": "pc",

  // Conectividad
  "conexion": "internet",
  "conectividad": "internet",
  "inalambrica": "wifi",
  "redinalambrica": "wifi",
  "wifi": "internet",
  "internet": "internet",
  "conectado": "internet",

  // Usuarios y cuentas
  "usuario": "cuenta",
  "usuarios": "cuenta",
  "clave": "password",
  "contraseña": "password",
  "pass": "password",
  "passwd": "password",
  "login": "acceso",
  "inicio": "acceso",
  "iniciosecion": "acceso",
  "ingreso": "acceso",
  "logueo": "acceso",

  // Software y sistemas
  "sistemaoperativo": "sistema",
  "os": "sistema",
  "so": "sistema",
  "windows10": "windows",
  "windows11": "windows",
  "win": "windows",
  "office365": "office",
  "msword": "word",
  "msexcel": "excel",
  "actualizacion": "update",
  "actualizar": "update",
  "instalar": "instalacion",
  "reinstalar": "instalacion",
  "formatear": "formateo",
  "formato": "formateo",
  "configurar": "configuracion",
  "setup": "configuracion",

  // Almacenamiento
  "discoduro": "hdd",
  "disco": "hdd",
  "unidad": "hdd",
  "almacenamiento": "hdd",
  "discosolido": "ssd",
  "unidadsolida": "ssd",
  "estadosolido": "ssd",
  "memoria": "ram",

  // Problemas y solicitudes
  "problema": "error",
  "error": "error",
  "falla": "error",
  "inconveniente": "error",
  "reclamo": "solicitud",
  "pedido": "solicitud",
  "solicito": "solicitud",
  "necesito": "solicitud",
  "requiero": "solicitud",
  "ayuda": "solicitud",
  "consulta": "solicitud",

  // Seguridad
  "bloqueo": "seguridad",
  "bloqueada": "seguridad",
  "bloqueado": "seguridad",
  "segura": "seguridad",
  "autenticacion": "seguridad",
  "verificacion": "seguridad",
  "otp": "token",
  "codigo": "token",

  // Diversos
  "pantallanegra": "pantalla",
  "enciende": "encendido",
  "reinicio": "reiniciar",
  "reiniciar": "reiniciar",
  "tarjetamadre": "motherboard",
  "procesador": "cpu",
  "tv": "pantalla",
  "television": "pantalla"
};

const phrases = {
  "correo electronico": "email",
  "inicio de sesion": "acceso",
  "unidad solida": "ssd",
  "disco duro": "hdd",
  "estado solido": "ssd",
  "tarjeta madre": "motherboard",
  "tarjeta grafica": "gpu",
  "memoria ram": "ram",
  "memoria rom": "rom",
  "pantalla borrosa": "borroso",
};

// Deja el texto limpio para el entrenamiento/clasificación
const hardSet = new Set(hardStopwords.map(w => stemmer.stem(w)));
const weakSet = new Set(weakStopwords.map(w => stemmer.stem(w)));
const protectedSet = new Set(protectedWords);

// Filtro de stopwords
function isMeaningfulWord(word, context) {
  if (hardSet.has(word)) return false;
  if (weakSet.has(word)) {
    return context.some(w => !weakSet.has(w) && !hardSet.has(w));
  }
  return true;
}

// Reemplaza las frases compuestas por palabras
function replacePhrases(text) {
  for (const [phrase, replacement] of Object.entries(phrases)) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    text = text.replace(regex, replacement);
  }
  return text;
}

/* ---- PRE PROCESADO DE TICKETS ---- */

function preprocess(text) {
  text = replacePhrases(text); // Transforma frases compuestas a una palabra

  let tokens = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")     // Elimina acentos
    .split(/\s+/)                        // Divide por palabras
    .map(word => word.replace(/[^a-z0-9]/g, '')) // Elimina signos de cada palabra
    .filter(word => word && !/^\d+$/.test(word)) // Elimina vacíos y números solos
    .map(word => synonyms[word] || word) // Reemplaza por sinonimos
    .map(word => protectedSet.has(word) ? word : stemmer.stem(word)); // Aplica stemming solo si NO está en palabras protegidas

  tokens = tokens.filter((word, _, arr) => isMeaningfulWord(word, arr));

  return tokens.join(' ');
}

module.exports = {
  preprocess,
  hardSet,
  weakSet
};
