import argparse
import json
import os
from typing import List, Dict, Any

# Dependencias esperadas:
# pip install bert-score rouge-score nltk sentence-transformers scikit-learn

try:
    from bert_score import score as bert_score
except Exception as e:  # pragma: no cover
    bert_score = None  # type: ignore

from rouge_score import rouge_scorer
from nltk.translate.bleu_score import sentence_bleu
from nltk.translate.bleu_score import SmoothingFunction
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


def compute_bleu_scores(reference: str, candidate: str) -> Dict[str, float]:
    ref_tokens = reference.split()
    cand_tokens = candidate.split()
    smoothing = SmoothingFunction().method1
    bleu1 = sentence_bleu([ref_tokens], cand_tokens, weights=(1, 0, 0, 0), smoothing_function=smoothing)
    bleu2 = sentence_bleu([ref_tokens], cand_tokens, weights=(0.5, 0.5, 0, 0), smoothing_function=smoothing)
    bleu4 = sentence_bleu(
        [ref_tokens], cand_tokens, weights=(0.25, 0.25, 0.25, 0.25), smoothing_function=smoothing
    )
    return {"bleu1": float(bleu1), "bleu2": float(bleu2), "bleu4": float(bleu4)}


def compute_rouge_scores(reference: str, candidate: str) -> Dict[str, float]:
    scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
    scores = scorer.score(reference, candidate)
    return {
        "rouge1": float(scores["rouge1"].fmeasure),
        "rouge2": float(scores["rouge2"].fmeasure),
        "rougeL": float(scores["rougeL"].fmeasure),
    }


def compute_bertscore(references: List[str], candidates: List[str], lang: str = "es") -> Dict[str, float]:
    if bert_score is None:
        raise RuntimeError("bert-score no está disponible. Instala con: pip install bert-score")
    P, R, F1 = bert_score(candidates, references, lang=lang)
    return {
        "precision": float(P.mean().item()),
        "recall": float(R.mean().item()),
        "f1": float(F1.mean().item()),
    }


def compute_cosine_similarity(references: List[str], candidates: List[str], model_name: str = "all-MiniLM-L6-v2") -> List[float]:
    model = SentenceTransformer(model_name)
    ref_emb = model.encode(references)
    cand_emb = model.encode(candidates)
    sims = []
    for i in range(len(references)):
        sim = cosine_similarity([cand_emb[i]], [ref_emb[i]])[0][0]
        sims.append(float(sim))
    return sims


def evaluate_items(items: List[Dict[str, Any]], lang: str = "es") -> Dict[str, Any]:
    references = [it.get("reference", "") for it in items]
    candidates = [it.get("prediction", "") for it in items]

    # Métricas por-item
    per_item: List[Dict[str, Any]] = []
    rouge_list: List[Dict[str, float]] = []
    bleu_list: List[Dict[str, float]] = []

    for it in items:
        ref = it.get("reference", "")
        cand = it.get("prediction", "")
        rouge = compute_rouge_scores(ref, cand)
        bleu = compute_bleu_scores(ref, cand)
        rouge_list.append(rouge)
        bleu_list.append(bleu)
        per_item.append({
            "index": it.get("index"),
            "rouge": rouge,
            "bleu": bleu,
        })

    # Métricas agregadas
    rouge_agg = {
        "rouge1": float(sum(x["rouge1"] for x in rouge_list) / max(1, len(rouge_list))),
        "rouge2": float(sum(x["rouge2"] for x in rouge_list) / max(1, len(rouge_list))),
        "rougeL": float(sum(x["rougeL"] for x in rouge_list) / max(1, len(rouge_list))),
    }

    bleu_agg = {
        "bleu1": float(sum(x["bleu1"] for x in bleu_list) / max(1, len(bleu_list))),
        "bleu2": float(sum(x["bleu2"] for x in bleu_list) / max(1, len(bleu_list))),
        "bleu4": float(sum(x["bleu4"] for x in bleu_list) / max(1, len(bleu_list))),
    }

    bert = compute_bertscore(references, candidates, lang=lang)
    cosines = compute_cosine_similarity(references, candidates)
    cosine_avg = float(sum(cosines) / max(1, len(cosines)))

    return {
        "summary": {
            "bertscore": bert,
            "rouge": rouge_agg,
            "bleu": bleu_agg,
            "cosine_similarity": {
                "average": cosine_avg
            }
        },
        "per_item": [
            {**per_item[i], "cosine_similarity": cosines[i]} for i in range(len(per_item))
        ]
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluación de RAG con BERTScore, ROUGE, BLEU y Cosine")
    parser.add_argument("--predictions", required=True, help="Ruta a predictions.json generado por el CLI TS")
    parser.add_argument("--out", required=False, default=None, help="Ruta de salida del reporte JSON")
    parser.add_argument("--lang", required=False, default="es", help="Código de idioma para BERTScore")
    parser.add_argument("--model", required=False, default="all-MiniLM-L6-v2", help="Modelo de sentence-transformers para coseno")
    args = parser.parse_args()

    with open(args.predictions, "r", encoding="utf-8") as f:
        data = json.load(f)
    items = data.get("items", [])

    report = evaluate_items(items, lang=args.lang)

    out_path = args.out
    if out_path is None:
        base_dir = os.path.dirname(args.predictions)
        out_path = os.path.join(base_dir, "report.json")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    print(f"\nReporte guardado en: {out_path}")


if __name__ == "__main__":
    main()


