import { ChatOpenAI } from "@langchain/openai";
import { DEFAULT_LLM_MODEL, OPENAI_API_KEY } from "../../config/environment.js";

export function createOllamaInstance(): any {
    console.log("[INIT] Creando instancia única de ChatOpenAI...");
    console.log(`[INIT] Modelo: ${DEFAULT_LLM_MODEL}`);

    if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY no encontrada. Exportá la variable de entorno: export OPENAI_API_KEY=tu_api_key");
    }

    return new ChatOpenAI({
        model: DEFAULT_LLM_MODEL,
        openAIApiKey: OPENAI_API_KEY,
        // Puedes ajustar temperatura, maxTokens, etc. si hace falta
    });
}
