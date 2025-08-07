import json
import tensorflow as tf

# ------------- CARGA DE MODELOS -----------------
def load_model_and_meta(model_path):
  model = tf.keras.models.load_model(f"{model_path}.h5")
  meta_path = model_path + '_meta.json'
  with open(meta_path, 'r', encoding='utf-8') as f:
    meta = json.load(f)
  return {
    'model': model,
    'tokenizer': meta['tokenizer'],
    'max_len': meta['max_len']
  }