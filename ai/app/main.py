from app.config.config import category_labels, priority_labels, category_model_path, priority_model_path
from app.services.classifier import classify_text
from app.models.models_charge import load_model_and_meta
from app.utils.preprocess import preprocess
from app.schemas.ticket import TicketInput
from app.db import create_db_pool
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

load_dotenv()

category_model = None
priority_model = None


# ------------------ API ---------------------
app = FastAPI()

origins = [
  "http://localhost:3000",
  "https://www.tracs.cloud",
  "http://johnafleming.cucei.udg.mx"
  # Cambiaremos esto cuando se requiera en CUCEI
]

app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["GET", "POST"],
  allow_headers=["*"],
)


# ------------------ ENDPOINTS ---------------------
@app.on_event("startup")
async def startup_event():
  global category_model, priority_model, db_pool
  await create_db_pool()

  category_model = load_model_and_meta(category_model_path)
  priority_model = load_model_and_meta(priority_model_path)
  print("Modelos cargados en memoria.")


@app.post('/classify')
async def classify_ticket_endpoint(ticket: TicketInput):
  global category_model, priority_model

  full = f"{ticket.building or ''} {ticket.room or ''} {ticket.title or ''} {ticket.report}".strip()
  combined = f"{ticket.title or ''} {ticket.report}".strip()
  meaningful = preprocess(combined).split()

  if len(meaningful) < 3:
    return {
      'category': 'Sin categoria',
      'secondaryCategory': None,
      'priority': 'Baja'
    }

  raw_cat = classify_text(combined, category_model, category_labels, threshold=0.4)
  raw_pri = classify_text(full, priority_model, priority_labels, default_label='Baja')

  category = raw_cat
  secondary_category = None
  if category.lower() in ('hardware', 'software'):
    category = 'Tecnico'
    secondary_category = raw_cat.capitalize()

  # if category.lower() == 'sin categoria':
  #   raw_pri = 'baja'

  return {
    'category': category.capitalize(),
    'secondaryCategory': secondary_category,
    'priority': raw_pri.capitalize()
  }


if __name__ == '__main__':
  import uvicorn
  uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
