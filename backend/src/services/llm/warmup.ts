import axios, { AxiosError } from "axios";
import { Tool } from "@langchain/core/tools";
import { ollamaUrl, DEFAULT_LLM_MODEL, DEFAULT_KEEP_ALIVE, DEFAULT_NUM_THREAD } from "../../config/environment.js";
import type { WarmLLMOptions } from "../../types/index.js";

export async function warmUpLLM(llm: any, tools?: Tool[]): Promise<void> {
    const maxAttempts = Number.parseInt(process.env.LLM_WARMUP_ATTEMPTS || "8", 10);
    const delayMs = Number.parseInt(process.env.LLM_WARMUP_DELAY_MS || "2000", 10);
    const warmOptions: WarmLLMOptions = { num_predict: 8 };
    if (DEFAULT_NUM_THREAD) warmOptions.num_thread = DEFAULT_NUM_THREAD;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            if (tools && tools.length > 0 && typeof llm.bindTools === "function") {
                const modelWithTools = llm.bindTools(tools);
                await modelWithTools.invoke("ok");
                console.log(`[LLM] Modelo precalentado con ${tools.length} tools`);
            } else {
                // Para proveedores OpenAI-like, un ping sencillo
                try {
                    await llm.invoke("ok");
                } catch (_) {
                    // fallback noop
                }
                console.log(`[LLM] Modelo precalentado`);
            }
            return;
        } catch (e) {
            const error = e as AxiosError;

            if (attempt < maxAttempts) {
                await new Promise((r) => setTimeout(r, delayMs));
            }
        }
    }
}
