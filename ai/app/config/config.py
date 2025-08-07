import os
from dotenv import load_dotenv


load_dotenv()
CONFIG_DIR = os.path.dirname(os.path.abspath(__file__))


# ------------- MODELOS ENTRENADOS -----------------
category_model_path = os.path.join(CONFIG_DIR, "training", "categoryClassifier")
priority_model_path = os.path.join(CONFIG_DIR, "training", "priorityClassifier")


# ------------- LABELS -----------------
category_labels = ["Software", "Hardware", "Mantenimiento", "Limpieza", "Sin categoria"]
priority_labels = ["Alta", "Media", "Baja"]


# -------------- DB ----------------
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = int(os.getenv('DB_PORT', 5432))


# ------------- PUERTOS ----------------
PORT = os.getenv('AI_PORT', 8000)