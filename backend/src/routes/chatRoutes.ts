import { Router, Request, Response } from "express";
import { detectQueryIntent } from "../services/router/intentRouter.js";
import { executeRAGQuery } from "../services/rag/ragService.js";
import { executeMCPQuery } from "../services/mcp/mcpService.js";
import { DEFAULT_LLM_MODEL } from "../config/environment.js";
import type { GlobalState } from "../types/index.js";

export function createChatRoutes(state: GlobalState): Router {
    const router = Router();

    router.post("/chat", async (req: Request, res: Response) => {
        try {
            const { payload } = req.body;
            const model = payload?.model || DEFAULT_LLM_MODEL;
            const userPrompt = payload?.userPrompt || payload?.prompt || "";
            const legajo = payload?.legajo || "";

            if (!userPrompt) return res.status(400).json({ error: "Missing userPrompt" });

            console.log(`\n${"=".repeat(60)}`);
            console.log(`[HYBRID] Nueva consulta: "${userPrompt}"`);
            console.log(`[HYBRID] Legajo: ${legajo || "N/A"}`);

            // 1. ROUTER: Detectar intención
            const intent = await detectQueryIntent(userPrompt, model);
            console.log(`[HYBRID] Intención: ${intent.type.toUpperCase()} (confianza: ${intent.confidence})`);

            // 2. EJECUTAR SEGÚN INTENCIÓN
            if (intent.type === 'rag') {
                console.log("[HYBRID] Usando sistema RAG");
                
                const ragResponse = await executeRAGQuery(state.ragChain, userPrompt);
                
                return res.status(200).json({
                    queryType: 'rag',
                    intent: intent,
                    summaryText: ragResponse,
                    data: {
                        type: 'institutional_info',
                        message: 'Información institucional de UADE'
                    }
                });
                
            } else {
                // MCP
                if (!legajo) {
                    return res.status(400).json({ 
                        error: "Se requiere legajo para consultas personales" 
                    });
                }

                const mcpResult = await executeMCPQuery(
                    state.clients,
                    state.tools,
                    userPrompt,
                    legajo,
                    model
                );
                
                return res.status(mcpResult.statusCode).json({
                    queryType: 'mcp',
                    intent: intent,
                    tool: mcpResult.tool,
                    parameters: mcpResult.parameters,
                    data: mcpResult.data,
                    summaryText: mcpResult.summaryText,
                });
            }
            
        } catch (err: any) {
            console.error("[HYBRID] Error:", err);
            res.status(500).json({ error: err.message || "Error interno" });
        }
    });

    return router;
}
