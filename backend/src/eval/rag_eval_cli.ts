import { readFile, writeFile, mkdir } from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createOllamaInstance } from "../services/llm/ollamaService.js";
import { initializeRAG, executeRAGQuery } from "../services/rag/ragService.js";

type QAItem = {
    pregunta: string;
    respuesta: string;
    [key: string]: any;
};

type PredictionItem = {
    index: number;
    question: string;
    reference: string;
    prediction: string;
};

function parseArgs(argv: string[]): Record<string, string> {
    const args: Record<string, string> = {};
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg.startsWith("--")) {
            const key = arg.slice(2);
            const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
            args[key] = value;
        }
    }
    return args;
}

async function ensureDir(dirPath: string): Promise<void> {
    await mkdir(dirPath, { recursive: true });
}

async function loadDataset(datasetPath: string): Promise<QAItem[]> {
    const raw = await readFile(datasetPath, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
        throw new Error("El dataset debe ser un array de objetos con { pregunta, respuesta }");
    }
    return data as QAItem[];
}

async function main(): Promise<void> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const args = parseArgs(process.argv);
    const datasetArg = args["dataset"] || path.join(__dirname, "../../data/generic-faqs.json");
    const outArg = args["out"] || path.join(__dirname, "../../eval/predictions.json");
    const limitArg = args["limit"] ? Number.parseInt(args["limit"], 10) : undefined;

    console.log("[EVAL] Cargando dataset:", datasetArg);
    const dataset = await loadDataset(datasetArg);
    const qaItems = typeof limitArg === "number" && !Number.isNaN(limitArg)
        ? dataset.slice(0, limitArg)
        : dataset;

    console.log(`[EVAL] Total pares QA: ${qaItems.length}`);

    console.log("[EVAL] Inicializando RAG/LLM...");
    const llm = createOllamaInstance();
    const { ragChain } = await initializeRAG(llm);

    const predictions: PredictionItem[] = [];

    for (let i = 0; i < qaItems.length; i++) {
        const item = qaItems[i];
        const q = (item.pregunta || "").toString();
        const ref = (item.respuesta || "").toString();
        if (!q || !ref) continue;

        console.log(`\n[EVAL] (${i + 1}/${qaItems.length}) Pregunta: ${q}`);
        const pred = await executeRAGQuery(ragChain, q);
        predictions.push({ index: i, question: q, reference: ref, prediction: pred });
    }

    const outDir = path.dirname(outArg);
    await ensureDir(outDir);
    await writeFile(outArg, JSON.stringify({ items: predictions }, null, 2), "utf8");
    console.log("\n[EVAL] Predicciones guardadas en:", outArg);
}

main().catch((err) => {
    console.error("[EVAL] Error en la generación de predicciones:", err);
    process.exit(1);
});


