from app.utils.preprocess import preprocess
import numpy as np

# ------------------- CLASIFICACIÓN DE TEXTO --------------------
def classify_text(text, model_obj, labels, threshold=0.5, default_label=None):
  model = model_obj['model']
  tokenizer = model_obj['tokenizer']
  max_len = model_obj['max_len']

  clean_text = preprocess(text)
  tokens = [tokenizer.get(w, 0) for w in clean_text.split()]
  padded = tokens[:max_len] + [0] * max(0, max_len - len(tokens))
  input_arr = np.array([padded])
  prediction = model.predict(input_arr)[0]
  max_prob = max(prediction)
  label_index = np.argmax(prediction)

  if max_prob < threshold:
    return default_label or "Sin categoria"
  else:
    return labels[label_index]