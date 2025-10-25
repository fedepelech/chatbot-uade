import { ChatOllama } from "@langchain/ollama";
import { ollamaUrl, DEFAULT_LLM_MODEL, DEFAULT_KEEP_ALIVE, DEFAULT_NUM_THREAD } from "../../config/environment.js";

export function createOllamaInstance(): ChatOllama {
    console.log("[INIT] Creando instancia única de ChatOllama...");
    console.log(`[INIT] Conectando a Ollama en: ${ollamaUrl}`);
    
    return new ChatOllama({
        baseUrl: ollamaUrl,
        model: DEFAULT_LLM_MODEL,
        keepAlive: DEFAULT_KEEP_ALIVE,
        numThread: DEFAULT_NUM_THREAD,
    });
}
