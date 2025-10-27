## Evaluación del RAG

Este módulo genera predicciones del sistema RAG sobre el dataset institucional y calcula métricas de calidad:

- BERTScore (Precision, Recall, F1)
- ROUGE (ROUGE-1, ROUGE-2, ROUGE-L)
- BLEU (BLEU-1, BLEU-2, BLEU-4)
- Similitud de Coseno (embeddings de sentence-transformers)

### Requisitos

- Node.js >= 18 (para ejecutar el CLI TS con `tsx`)
- Python 3.8+ y `pip`

### Instalación de dependencias Python

```bash
cd backend
npm run eval:setup
```

### Generar predicciones y reporte

```bash
# Genera predicciones RAG en src/eval/predictions.json
npm run eval:predict

# Calcula métricas y genera src/eval/report.json
npm run eval:report

# Secuencia completa
npm run eval:rag
```

Por defecto se evalúa contra `data/generic-faqs.json`. Podés limitar la cantidad con `--limit`:

```bash
npx tsx src/eval/rag_eval_cli.ts --limit 20
```

### Estructura de archivos

- `src/eval/rag_eval_cli.ts`: CLI que inicializa el RAG y produce `predictions.json` con pares `{ question, reference, prediction }`.
- `src/eval/metrics.py`: Script Python que calcula las métricas y produce `report.json`.
- `src/eval/requirements.txt`: Dependencias Python para métricas.

### Salidas

- `src/eval/predictions.json`
- `src/eval/report.json` con el siguiente resumen:

```json
{
  "summary": {
    "bertscore": { "precision": 0.0, "recall": 0.0, "f1": 0.0 },
    "rouge": { "rouge1": 0.0, "rouge2": 0.0, "rougeL": 0.0 },
    "bleu": { "bleu1": 0.0, "bleu2": 0.0, "bleu4": 0.0 },
    "cosine_similarity": { "average": 0.0 }
  },
  "per_item": [
    { "index": 0, "rouge": { ... }, "bleu": { ... }, "cosine_similarity": 0.0 }
  ]
}
```


