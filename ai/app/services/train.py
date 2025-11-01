from app.db import fetch_category_data, fetch_priority_data, fetch_category_test_data, fetch_priority_test_data

from app.config.config import category_labels, priority_labels, category_model_path, priority_model_path
from app.models.model import create_model
from app.utils.preprocess import preprocess
from app.utils.plot import plot_confusion_matrix
from app.services.tokenizer import tokenize_data, vectorize
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix as sk_confusion
from sklearn.utils.class_weight import compute_class_weight
from tensorflow.keras.callbacks import ReduceLROnPlateau, ModelCheckpoint
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
  max_len = 60

  X = vectorize(texts, tokenizer, max_len).astype('int32')
  y = np.array(outputs, dtype=np.int32)

  X_train, X_val, y_train, y_val = train_test_split(
      X, y, test_size=0.20, random_state=42, stratify=y
  )
  X_train = X_train.astype('int32')
  X_val   = X_val.astype('int32')


  classes = np.unique(y_train)
  cw = compute_class_weight(class_weight='balanced', classes=classes, y=y_train)
  class_weight = {int(c): float(w) for c, w in zip(classes, cw)}

  # if field == 'priority':
  #   # idx_baja = labels.index('Baja')
  #   idx_media = labels.index('Media')
  #   idx_alta = labels.index('Alta')
  #   # class_weight[idx_baja] *= 1.10
  #   class_weight[idx_media] *= 0.95
  #   class_weight[idx_alta] *= 1.15


  model = create_model(len(labels), len(vocabulary))

  callbacks = [
    ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=4, min_delta=1e-4, cooldown=1, min_lr=1e-5, verbose=0),
    ModelCheckpoint(f"{model_path}_best.keras", monitor="val_loss", save_best_only=True, verbose=0),
  ]

  history = model.fit(
    X_train, y_train,
    epochs=300,
    batch_size=64,
    validation_data=(X_val, y_val),
    class_weight=class_weight,
    shuffle=True,
    callbacks=callbacks,
    verbose=0
  )

  best_model = load_model(f"{model_path}_best.keras")
  best_model.save(f"{model_path}.h5")

  meta_path = model_path + '_meta.json'
  with open(meta_path, 'w', encoding='utf-8') as f:
    json.dump({'tokenizer': tokenizer, 'max_len': max_len}, f, ensure_ascii=False)

  val_preds = np.argmax(best_model.predict(X_val, batch_size=256, verbose=0), axis=1)

  print("\n=== RESULTADOS EN VALIDACIÓN ===")
  print(classification_report(y_val, val_preds, target_names=labels, digits=3))

  cm = sk_confusion(y_val, val_preds)

  image_filename = model_path + '_confusion_matrix.png'
  plot_confusion_matrix(cm, labels, f'Matriz de Confusión (VAL) - {field.upper()}', image_filename)
  print(f'Matriz de confusión guardada.')


# ------------------- ENTRENAMIENTO DE LOS MODELOS --------------------
async def train_all_models():
  dsn = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
  pool = await asyncpg.create_pool(dsn=dsn)
  try:
    category_data = await fetch_category_data(pool)
    await train_and_save_model(category_data, 'category', category_labels, category_model_path)
    priority_data = await fetch_priority_data(pool)
    await train_and_save_model(priority_data, 'priority', priority_labels, priority_model_path)
    
    await evaluate_on_external_test(category_model_path, category_labels, pool, fetch_category_test_data, 'category')
    await evaluate_on_external_test(priority_model_path, priority_labels, pool, fetch_priority_test_data, 'priority')

    print('Modelos entrenados y guardados.')
  finally:
    await pool.close()


async def evaluate_on_external_test(model_path, labels, pool, fetch_fn, field_name):
  meta_path = model_path + '_meta.json'
  with open(meta_path, 'r', encoding='utf-8') as f:
    meta = json.load(f)
  tokenizer = meta['tokenizer']
  max_len = meta['max_len']

  best_model = load_model(f"{model_path}_best.keras")
  best_model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])


  test_data = await fetch_fn(pool)
  if not test_data:
    print("\nTest externo vacío; se omite evaluación externa.")
    return

  texts = [preprocess(d['text']) for d in test_data]
  if field_name == 'category':
    y_true = np.array([labels.index(d['category']) for d in test_data])
  else:
    y_true = np.array([labels.index(d['priority']) for d in test_data])

  X_test = vectorize(texts, tokenizer, max_len).astype('int32')

  y_pred = np.argmax(best_model.predict(X_test, batch_size=256, verbose=0), axis=1)
  print(f"\n=== RESULTADOS EN TEST EXTERNO ({field_name.upper()}) ===")
  print(classification_report(y_true, y_pred, target_names=labels, digits=3))

  cm = sk_confusion(y_true, y_pred)
  image_filename = model_path + '_external_test_confusion_matrix.png'
  plot_confusion_matrix(cm, labels, f'Matriz de Confusión (TEST externo) - {field_name.upper()}', image_filename)
  print(f'Matriz de confusión (externa) guardada.')


asyncio.run(train_all_models())
