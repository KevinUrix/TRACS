from app.db import fetch_category_data, fetch_priority_data
from app.config.config import category_labels, priority_labels, category_model_path, priority_model_path
from app.models.model import create_model
from app.utils.preprocess import preprocess
from app.utils.plot import plot_confusion_matrix
from app.services.tokenizer import tokenize_data, vectorize
import asyncpg
import asyncio
import json
import numpy as np
import os


# ----------------- ENTRENAMIENTO Y GUARDADO ----------------------
async def train_and_save_model(data, field, labels, model_path):
  texts = [preprocess(d['text']) for d in data]
  outputs = [labels.index(d[field]) if d[field] in labels else len(labels) - 1 for d in data]

  tokenizer, vocabulary = tokenize_data(texts)
  max_len = 30

  X = vectorize(texts, tokenizer, max_len)
  y = np.array(outputs)

  model = create_model(len(labels), max_len, len(vocabulary))
  model.fit(X, y, epochs=50, batch_size=32, verbose=2)

  model.save(f"{model_path}.h5")

  meta_path = model_path + '_meta.json'
  with open(meta_path, 'w', encoding='utf-8') as f:
    json.dump({'tokenizer': tokenizer, 'max_len': max_len}, f, ensure_ascii=False)

  predictions = model.predict(X)
  pred_indices = np.argmax(predictions, axis=1)

  confusion_matrix = np.zeros((len(labels), len(labels)), dtype=int)
  for true_idx, pred_idx in zip(y, pred_indices):
    confusion_matrix[true_idx, pred_idx] += 1

  print('\nPrecisión por clase:')
  for i, label in enumerate(labels):
    correct = confusion_matrix[i, i]
    total = np.sum(confusion_matrix[i])
    accuracy = (correct / total * 100) if total > 0 else 0
    print(f"{label.ljust(15)}: {correct}/{total} ({accuracy:.2f}%)")

  image_filename = model_path + '_confusion_matrix.png'
  plot_confusion_matrix(confusion_matrix, labels, f'Matriz de Confusión - {field.upper()}', image_filename)


# ------------------- ENTRENAMIENTO DE LOS MODELOS --------------------
async def train_all_models():
  dsn = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
  
  # Crea el pool de la DB
  pool = await asyncpg.create_pool(dsn=dsn)

  try:
    category_data = await fetch_category_data(pool)
    await train_and_save_model(category_data, 'category', category_labels, category_model_path)

    priority_data = await fetch_priority_data(pool)
    await train_and_save_model(priority_data, 'priority', priority_labels, priority_model_path)

    print('Modelos entrenados y guardados.')

  finally:
    await pool.close()


asyncio.run(train_all_models())