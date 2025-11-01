import re
import unicodedata
from nltk.stem.snowball import SnowballStemmer

stemmer = SnowballStemmer("spanish")

hard_stopwords = [
  "el", "la", "los", "las", "un", "una", "unos", "unas",
  "de", "del", "al", "y", "o", "u", "en", "con",
  "por", "para", "a", "ante", "bajo", "cabe", "contra",
  "desde", "hacia", "hasta", "mediante",
  "segun", "sobre", "tras", "que", "como", "cuando", "donde",
  "quien", "cual", "cuales", "cuyo", "cuyos", "cuya", "cuyas",
  "lo", "se", "su", "sus", "mi", "mis", "tu", "tus", "nuestro", "nuestra",
  "nosotros", "vosotros", "ellos", "ellas", "usted", "ustedes",
  "yo", "tu", "el", "ella", "nos", "os", "me", "te", "le", "les",
  "es", "era", "fue", "son", "ser", "soy", "eres", "estoy", "esta", "estan", "estamos",
  "buenas", "tardes", "hola", "hello", "gracias", "buenos", "saludos", "atentamente",
  "despido", "lejos", "acerca", "junto", "aqui", "ahi",
  "alguien", "algo", "haremos", "decir", "dar", "damos", "tener", "tenemos", "venir", "ver", "vemos", "oir", "oimos", "pensar", "saber", "creer", "estar", "seguir", "pienso", "sabemos", "pero", "siendo", "eso", "da"
]

weak_stopwords = [
  "muy", "ya", "aun", "todavia", "solo", "solamente", "si", "no",
  "poco", "mas", "menos", "tambien", "tampoco", "incluso",
  "entonces", "ademas", "luego", "asi", "quiza", "quizas",
  "casi", "aunque", "mismo", "bien", "mal", "mucho", "bastante",
  "demasiado", "ayuda",
  "necesito", "requiero", "requiere", "pido", "quiero",
  "solicito", "solicita",
  "presenta", "presento", "porfavor", "porfa", "favor", "hay",
  "senor", "senora", "maestra", "doctora", "doctor", "profesor", "profesora", "mtra", "mtro",
  "etc", "entre", "alrededor", "cerca", "fabuloso", "porque", "esto", "segundo", "primero",
  "muchos", "pocos", "hacer", "hacerlo", "ninguno", "ninguna", "ningunos", "ningunas", "todos", "todas", "profe", "docente", "decimos", "daremos", "maestro"
]

protected_words = {
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
  "contrasena", "otp", "autenticacion", "seguridad", "acceso", "permiso",
  "bloqueo", "captcha", "certificado", "cifrado", "switch", "rj45", "tv", "television",
  "internet", "drivers"
}


urgent_set = {
  "urgente", "urgencia", "emergencia", "inmediato", "inmediata",
  "critico", "criticos", "critica", "criticas", "caido", "caidos", "caida", "caidas", "apagado", "apagada", "apagados", "apagadas",
  "funciona", "enciende", "prende",
  "riesgo", "peligro", "fuga", "incendio", "derrame",
  "hoy", "ahora", "manana", "examen", "clase", "peligroso",
  "peligrosa", "riesgoso", "riesgosa", "funciono", "funciona", "peligra", "incendia",
  "derramo"
}


synonyms = {
  "correo": "email",
  "correoelectronico": "email",
  "e-mail": "email",
  "mail": "email",
  "mensaje": "email",

  "computadora": "pc",
  "ordenador": "pc",
  "portatil": "laptop",
  "notebook": "laptop",
  "equipo": "pc",
  "maquina": "pc",

  "conexion": "internet",
  "conectividad": "internet",
  "inalambrica": "wifi",
  "redinalambrica": "wifi",
  "internet": "internet",
  "conectado": "internet",

  "usuario": "cuenta",
  "usuarios": "cuenta",
  "clave": "password",
  "contrasena": "password",
  "pass": "password",
  "passwd": "password",
  "login": "acceso",
  "inicio": "acceso",
  "iniciosecion": "acceso",
  "ingreso": "acceso",
  "logueo": "acceso",

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
  # "formato": "formateo",
  "configurar": "configuracion",
  "setup": "configuracion",

  "discoduro": "hdd",
  "disco": "hdd",
  "unidad": "hdd",
  "almacenamiento": "hdd",
  "discosolido": "ssd",
  "unidadsolida": "ssd",
  "estadosolido": "ssd",
  "memoria": "ram",

  # "problema": "error",
  "falla": "error",
  "inconveniente": "error",
  "reclamo": "solicitud",
  "pedido": "solicitud",
  "solicito": "solicitud",
  "necesito": "solicitud",
  "requiero": "solicitud",
  "ayuda": "solicitud",
  "consulta": "solicitud",

  # "bloqueo": "seguridad",
  # "bloqueada": "seguridad",
  # "bloqueado": "seguridad",
  "segura": "seguridad",
  "autenticacion": "seguridad",
  "verificacion": "seguridad",
  "otp": "token",
  "codigo": "token",

  "pantallanegra": "pantalla",
  "reinicio": "reiniciar",
  "reiniciar": "reiniciar",
  "tarjetamadre": "motherboard",
  "procesador": "cpu",
  "tv": "television",
  "enchufe": "tomacorriente",
  "contacto": "tomacorriente",
  "controladores": "drivers"
}

phrases = {
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
  "corto circuito": "cortocircuito",
  "toma corriente": "tomacorriente",
  "toma de corriente": "tomacorriente",
}

# Creamos de las listas de palabras
hard_set = set(stemmer.stem(w) for w in hard_stopwords)
weak_set = set(stemmer.stem(w) for w in weak_stopwords)
protected_set = protected_words

def replace_phrases(text: str) -> str:
  for phrase, replacement in phrases.items():
    pattern = re.compile(r'\b' + re.escape(phrase) + r'\b', flags=re.IGNORECASE)
    text = pattern.sub(replacement, text)
  return text

def preprocess(text: str) -> str:
  text = text.lower()


  # Normaliza y elimina los acentos
  text = unicodedata.normalize("NFD", text)
  text = re.sub(r'[\u0300-\u036f]', '', text)

  # Reemplaza frases
  text = replace_phrases(text)

  # Tokeniza y limpia los tokens
  tokens = re.split(r'\s+', text)
  tokens = [re.sub(r'[^a-z0-9]', '', t) for t in tokens]
  tokens = [re.sub(r'\d+', '', t) for t in tokens]
  tokens = [t for t in tokens if t]
  # tokens = [t for t in tokens if t and not re.fullmatch(r'\d+', t)]

  # Sinonimos y stemming
  processed_tokens = []
  for word in tokens:
    word = synonyms.get(word, word)
    if word in protected_set or word in urgent_set:
    # if word in protected_set:
      processed_tokens.append(word)
    else:
      processed_tokens.append(stemmer.stem(word))

  # Filtramos las palabras
  has_strong_word = any(
    (stemmer.stem(w) not in weak_set) and (stemmer.stem(w) not in hard_set)
    for w in processed_tokens
  )

  filtered_tokens = []
  for w in processed_tokens:
    sw = stemmer.stem(w)
    if sw in hard_set:
      continue
    if sw in weak_set and not has_strong_word:
      continue
    filtered_tokens.append(w)

  return ' '.join(filtered_tokens)
