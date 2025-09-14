from app.utils.preprocess import preprocess, protected_set
import numpy as np

# ------------------- CLASIFICACIÓN DE TEXTO --------------------
def classify_text(text, model_obj, labels, threshold=0.4, default_label=None):
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

  print(max_prob)
  if max_prob < threshold:
    print(max_prob)
    return default_label or "Sin categoria"
  else:
    return labels[label_index]