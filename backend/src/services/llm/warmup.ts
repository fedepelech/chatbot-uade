import axios, { AxiosError } from "axios";
import { ChatOllama } from "@langchain/ollama";
import { Tool } from "@langchain/core/tools";
import { ollamaUrl, DEFAULT_LLM_MODEL, DEFAULT_KEEP_ALIVE, DEFAULT_NUM_THREAD } from "../../config/environment.js";
import type { WarmLLMOptions } from "../../types/index.js";

export async function warmUpLLM(llm: ChatOllama, tools?: Tool[]): Promise<void> {
    const maxAttempts = Number.parseInt(process.env.LLM_WARMUP_ATTEMPTS || "8", 10);
    const delayMs = Number.parseInt(process.env.LLM_WARMUP_DELAY_MS || "2000", 10);
    const warmOptions: WarmLLMOptions = { num_predict: 8 };
    if (DEFAULT_NUM_THREAD) warmOptions.num_thread = DEFAULT_NUM_THREAD;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            if (tools && tools.length > 0) {
                const modelWithTools = llm.bindTools(tools);
                await modelWithTools.invoke("ok");
                console.log(`[LLM] Modelo precalentado con ${tools.length} tools`);
            } else {
                await axios.post(`${ollamaUrl}/api/generate`, {
                    model: DEFAULT_LLM_MODEL,
                    prompt: "ok",
                    stream: false,
                    keep_alive: DEFAULT_KEEP_ALIVE,
                    options: warmOptions,
                });
                console.log(`[LLM] Modelo precalentado`);
            }
            return;
        } catch (e) {
            const error = e as AxiosError;
            const status = error.response?.status;
            
            if (status === 404) {
                try {
                    console.log(`[LLM] Pulling modelo: ${DEFAULT_LLM_MODEL}...`);
                    await axios.post(`${ollamaUrl}/api/pull`, {
                        name: DEFAULT_LLM_MODEL,
                        stream: false,
                    });
                } catch (pullErr) {
                    console.warn("[LLM] Falló el pull");
                }
            }

            if (attempt < maxAttempts) {
                await new Promise((r) => setTimeout(r, delayMs));
            }
        }
    }
}
