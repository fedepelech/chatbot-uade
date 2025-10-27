# Evaluación de Métricas para RAG (Retrieval-Augmented Generation)

Este documento explica las métricas implementadas para evaluar el sistema RAG del chatbot, cómo funcionan, sus diferencias y los resultados obtenidos.

## 📊 Métricas Implementadas

### 1. BERTScore (F1: 0.80)

**¿Qué es?**
BERTScore es una métrica basada en embeddings contextuales que evalúa la similitud semántica entre el texto de referencia y la predicción.

**Cómo funciona:**
- Utiliza el modelo BERT para generar representaciones vectoriales de ambas oraciones
- Calcula la similitud de palabras entre ambas representaciones mediante la similitud de coseno
- Retorna tres métricas:
  - **Precision** (0.73): Proporción de tokens predichos que están en la referencia
  - **Recall** (0.89): Proporción de tokens de referencia capturados en la predicción
  - **F1** (0.80): Media armónica de precision y recall

**Ventajas:**
- Captura similitud semántica, no solo lexical
- Funciona bien con parafraseo
- Más robusto que métricas n-gram

### 2. ROUGE (Rouge-L: 0.48)

**¿Qué es?**
ROUGE (Recall-Oriented Understudy for Gisting Evaluation) es una familia de métricas orientadas a la coherencia de n-gramas.

**Variantes implementadas:**
- **ROUGE-1** (0.50): Coincidencia de unigramas (palabras individuales)
- **ROUGE-2** (0.42): Coincidencia de bigramas (pares consecutivos)
- **ROUGE-L** (0.48): Mayor subsecuencia común (LCS) que evalúa fluidez

**Cómo funciona:**
- Cuenta cuántos n-gramas del texto candidato aparecen en el texto de referencia
- Considera la longitud de la secuencia más larga común
- Prioriza el recall sobre precision (orientado a gist/captación)

**Cuándo usar:**
- Útil para tareas de resumen y generación de texto
- Evalúa cobertura de información clave

### 3. BLEU (BLEU-4: 0.24)

**¿Qué es?**
BLEU (Bilingual Evaluation Understudy) es una métrica clásica para evaluación automática de traducción y generación.

**Variantes implementadas:**
- **BLEU-1** (0.32): Coincidencia de unigramas
- **BLEU-2** (0.29): Coincidencia de bigramas
- **BLEU-4** (0.24): Coincidencia de 4-gramas (la más estricta)

**Cómo funciona:**
- Cuenta n-gramas que coinciden exactamente entre referencia y predicción
- Aplica un factor de penalización por brevedad (brevity penalty)
- Usa suavizado (smoothing) para evitar cero cuando no hay coincidencias

**Características:**
- Estricto: Requiere coincidencia exacta de n-gramas
- Penaliza respuestas demasiado cortas o largas
- Menos tolerante al parafraseo que ROUGE

### 4. Cosine Similarity (0.80)

**¿Qué es?**
Similitud de coseno entre embeddings semánticos de oraciones completas.

**Cómo funciona:**
- Usa el modelo `sentence-transformers` para generar embeddings densos
- Calcula la similitud del coseno entre vectores de referencia y predicción
- Valor entre -1 y 1 (nuestro resultado: 0.80 = 80% similar)

**Ventajas:**
- Captura similitud semántica a nivel de oración completa
- Eficiente computacionalmente
- Independiente de la estructura sintáctica

## 🔍 Diferencias entre Métricas

| Característica | BERTScore | ROUGE | BLEU | Cosine Similarity |
|---|---|---|---|---|
| **Enfoque** | Semántico contextual | N-gramas recall | N-gramas precision | Semántico vectorial |
| **Tolerancia a parafraseo** | Alta | Media | Baja | Alta |
| **Orden de palabras** | No crítico | Parcial | Crítico | No crítico |
| **Mejor para** | Significado semántico | Cobertura de info | Coincidencia exacta | Similitud global |

## 📈 Análisis de Resultados

### Resumen de Métricas

```json
{
  "bertscore": { "f1": 0.80, "precision": 0.73, "recall": 0.89 },
  "rouge": { "rouge1": 0.50, "rouge2": 0.42, "rougeL": 0.48 },
  "bleu": { "bleu1": 0.32, "bleu2": 0.29, "bleu4": 0.24 },
  "cosine_similarity": { "average": 0.80 }
}
```

### Interpretación

**Fortalezas del sistema:**
1. **BERTScore F1: 0.80** - Excelente similitud semántica, indica que el chatbot comprende bien el significado
2. **Recall alto (0.89)** - El sistema captura la mayoría de información relevante de la referencia
3. **Cosine Similarity: 0.80** - Respuestas tienen alta similitud semántica con las respuestas esperadas

**Áreas de mejora:**
1. **BLEU bajo** - Las respuestas tienden a ser más largas y parafraseadas que la referencia exacta
2. **ROUGE moderado** - Hay contenido adicional en las respuestas que no está en la referencia

**Patrón observado:**
Las predicciones del chatbot tienen tendencia a:
- Incluir frases de cortesía y cierre ("¡Éxitos!", "No dudes en preguntar")
- Parafrasear la información en lugar de replicar el texto exacto
- Proporcionar contexto adicional o sugerencias

Esto es **comportamiento esperado** en un chatbot conversacional, que busca generar respuestas naturales y útiles, no textos idénticos a las referencias.

## 🛠️ Implementación Técnica

### Arquitectura

El sistema de evaluación consta de dos componentes principales:

#### 1. Generación de Predicciones (`rag_eval_cli.ts`)

- **TipoScript/Node.js** - CLI para generar predicciones
- Carga dataset de preguntas y respuestas de referencia
- Inicializa el pipeline RAG con Ollama
- Ejecuta cada pregunta contra el sistema RAG
- Guarda resultados en `predictions.json` con estructura:
  ```typescript
  {
    index: number,
    question: string,
    reference: string,  // Respuesta esperada
    prediction: string  // Respuesta del chatbot
  }
  ```

#### 2. Cálculo de Métricas (`metrics.py`)

- **Python** - Script para calcular métricas de evaluación
- Procesa `predictions.json` y calcula 4 tipos de métricas
- Utiliza bibliotecas especializadas para cada métrica:
  - `bert-score`: BERTScore
  - `rouge-score`: ROUGE
  - `nltk`: BLEU
  - `sentence-transformers` + `scikit-learn`: Cosine Similarity
- Genera `report.json` con métricas agregadas y por-item

### Flujo de Evaluación

```
[Dataset JSON] → [rag_eval_cli.ts] → [predictions.json]
                                           ↓
                                   [metrics.py]
                                           ↓
                                     [report.json]
```

### Uso

**1. Generar predicciones:**
```bash
npm run eval:rag
# o
tsx backend/src/eval/rag_eval_cli.ts --dataset data/generic-faqs.json --out backend/src/eval/predictions.json
```

**2. Calcular métricas:**
```bash
python backend/src/eval/metrics.py \
  --predictions backend/src/eval/predictions.json \
  --out backend/src/eval/report.json \
  --lang es
```

### Dependencias

**Node.js:**
- Sistema RAG (LangChain)
- Ollama LLM

**Python:**
```txt
bert-score==0.3.13          # BERTScore
rouge-score==0.1.2          # ROUGE
nltk==3.9.1                 # BLEU + tokenización
sentence-transformers==3.1.1 # Embeddings
scikit-learn==1.5.2         # Cosine similarity
```

## 💡 Conclusiones

El sistema RAG muestra **buen rendimiento semántico** (BERTScore 0.80, Cosine 0.80) pero genera respuestas más extensas y conversacionales que las referencias. Esto es apropiado para un chatbot, que debe:
- Capturar el significado correcto ✅
- Proporcionar contexto adicional ✅
- Mantener tono conversacional ✅

Las métricas basadas en n-gramas (BLEU, ROUGE) son útiles para evaluar coincidencia textual, pero BERTScore y Cosine Similarity son más apropiadas para evaluar chatbots conversacionales.

