import asyncpg
import os
from app.config.config import category_labels

async def create_db_pool():
  global db_pool
  db_pool = await asyncpg.create_pool(
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASS'),
    database=os.getenv('DB_NAME'),
    host=os.getenv('DB_HOST'),
    port=int(os.getenv('DB_PORT', 5432))
  )


async def fetch_category_data(pool):
  rows = await pool.fetch("SELECT title, report, category FROM tickets WHERE category IS NOT NULL")
  data = []
  for row in rows:
    cat_raw = (row['category'] or '').capitalize()
    cat_processed = ''

    # Se manejan las subcategorías: Tecnico (Hardware)
    cat_lower = cat_raw.lower()
    if 'hardware' in cat_lower:
      cat_processed = 'Hardware'
    elif 'software' in cat_lower:
      cat_processed = 'Software'
    elif cat_raw in category_labels:
      cat_processed = cat_raw
    else:
      cat_processed = 'Sin categoria'

    # Si la categoría no está en las etiquetas se va a Sin categoria
    if cat_processed not in category_labels:
      cat_processed = 'Sin categoria'
    
    full_text = f"{row['title'] or ''} {row['report'] or ''}".strip()
    data.append({'text': full_text, 'category': cat_processed})
    
  return data


async def fetch_priority_data(pool):
  rows = await pool.fetch("SELECT building, room, title, report, priority FROM tickets WHERE priority IS NOT NULL")
  data = []
  for row in rows:
    prio = (row['priority'] or 'baja').capitalize()
    raw_text = f"{row['building']} {row['room'] or ''} {row['title'] or ''} {row['report'] or ''}".strip()
    data.append({'text': raw_text, 'priority': prio})
  return data