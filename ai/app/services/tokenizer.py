import numpy as np


# -----------------
# CREA UN DICCIONARIO A PARTIR DE LAS PALABRAS y lo pasa a vectorize
# -----------------
def tokenize_data(texts):
  vocab = sorted(set(word for sentence in texts for word in sentence.split()))
  tokenizer = {word: idx + 1 for idx, word in enumerate(vocab)}
  return tokenizer, vocab


# ------------- VECTORIZA LO QUE SE HACE EN tokenize_data -----------------
def vectorize(texts, tokenizer, max_len):
  vectors = []
  for sentence in texts:
    tokens = [tokenizer.get(w, 0) for w in sentence.split()]
    padded = tokens[:max_len] + [0] * max(0, max_len - len(tokens))
    vectors.append(padded)
  return np.array(vectors)