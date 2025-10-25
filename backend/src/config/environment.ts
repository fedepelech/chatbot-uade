import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ollama Configuration
export const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
export const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";

// LLM Configuration
export const DEFAULT_LLM_MODEL = process.env.LLM_MODEL || "llama3.2:3b-instruct-q4_K_M";
export const DEFAULT_KEEP_ALIVE = process.env.LLM_KEEP_ALIVE || "1h";
export const DEFAULT_NUM_PREDICT = Number.parseInt(process.env.LLM_NUM_PREDICT || "512", 10);
export const DEFAULT_NUM_THREAD = process.env.LLM_NUM_THREAD
    ? Number.parseInt(process.env.LLM_NUM_THREAD, 10)
    : undefined;

// File Paths
const backendRoot = path.join(__dirname, "../..");
export const CONFIG_FILE_PATH = path.join(backendRoot, "config/config.json");
export const KNOWLEDGE_BASE_FILE_PATH = path.join(backendRoot, "data/generic-faqs.json");

// Server Configuration
export const PORT = process.env.PORT || 4000;
