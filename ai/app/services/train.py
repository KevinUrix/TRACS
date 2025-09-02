from app.db import fetch_category_data, fetch_priority_data
from app.config.config import category_labels, priority_labels, category_model_path, priority_model_path
from app.models.model import create_model
from app.utils.preprocess import preprocess
from app.utils.plot import plot_confusion_matrix
from app.services.tokenizer import tokenize_data, vectorize
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix as sk_confusion
from sklearn.utils.class_weight import compute_class_weight
from tensorflow.keras.callbacks import ReduceLROnPlateau
from tensorflow.keras.callbacks import ModelCheckpoint
from tensorflow.keras.models import load_model

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

  X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
  )

  classes = np.unique(y_train)
  cw = compute_class_weight(class_weight='balanced', classes=classes, y=y_train)
  class_weight = {int(c): float(w) for c, w in zip(classes, cw)}

  model = create_model(len(labels), max_len, len(vocabulary))

  callbacks = [
    ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6),
    ModelCheckpoint(f"{model_path}_best.keras", monitor="val_loss", save_best_only=True, verbose=1),
  ]

  history = model.fit(
    X_train, y_train,
    epochs=200,
    batch_size=32,
    validation_data=(X_val, y_val),
    class_weight=class_weight,
    shuffle=True,
    callbacks=callbacks,
    verbose=2
  )

  best_model = load_model(f"{model_path}_best.keras")
  best_model.save(f"{model_path}.h5")

  meta_path = model_path + '_meta.json'
  with open(meta_path, 'w', encoding='utf-8') as f:
    json.dump({'tokenizer': tokenizer, 'max_len': max_len}, f, ensure_ascii=False)

  val_preds = np.argmax(best_model.predict(X_val, verbose=0), axis=1)

  print("\n=== RESULTADOS EN VALIDACIÓN ===")
  print(classification_report(y_val, val_preds, target_names=labels, digits=3))

  cm = sk_confusion(y_val, val_preds)

  image_filename = model_path + '_confusion_matrix.png'
  plot_confusion_matrix(cm, labels, f'Matriz de Confusión (VAL) - {field.upper()}', image_filename)
  print(f'Matriz de confusión guardada en: {image_filename}')


# ------------------- ENTRENAMIENTO DE LOS MODELOS --------------------
async def train_all_models():
  dsn = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
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
