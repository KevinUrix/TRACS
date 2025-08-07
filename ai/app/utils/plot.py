import matplotlib.pyplot as plt
import seaborn as sns

# ------------------ MATRIZ DE CONFUSIÓN ---------------------
def plot_confusion_matrix(confusion_matrix, labels, title, save_path):
  plt.figure(figsize=(8, 6))
  sns.heatmap(confusion_matrix, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
  plt.title(title)
  plt.xlabel('Predicción')
  plt.ylabel('Etiqueta real')
  plt.tight_layout()
  plt.savefig(save_path)
  plt.close()