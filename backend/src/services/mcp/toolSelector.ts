import axios from "axios";
import { Tool } from "@langchain/core/tools";
import { ollamaUrl, DEFAULT_KEEP_ALIVE, DEFAULT_NUM_THREAD } from "../../config/environment.js";
import type { ToolSelection } from "../../types/index.js";

export async function selectToolWithLLM(
    userPrompt: string,
    model: string,
    legajo: string,
    tools: Tool[]
): Promise<ToolSelection> {
    const toolsDescription = tools
        .map((t: any) => `- ${t.name || ""}: ${t.description || ""}`)
        .join("\n");

    const systemPrompt = `Eres UadeBot. Selecciona la herramienta MCP apropiada para consultas PERSONALES del estudiante.

Herramientas disponibles:
${toolsDescription}

El legajo del estudiante es: ${legajo}

Responde con JSON:
{
  "tool": "nombre_herramienta",
  "parameters": {"legajo": "${legajo}"}
}

Consulta:`;

    const fullPrompt = `${systemPrompt}\n\n"${userPrompt}"\n\nRespuesta:`;

    try {
        const response = await axios.post(`${ollamaUrl}/api/generate`, {
            model,
            prompt: fullPrompt,
            stream: false,
            keep_alive: DEFAULT_KEEP_ALIVE,
            options: {
                num_predict: 200,
                temperature: 0.1,
                num_thread: DEFAULT_NUM_THREAD,
            },
        });

        const llmResponse = response.data.response.trim();
        const firstBrace = llmResponse.indexOf('{');
        const lastBrace = llmResponse.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonStr = llmResponse.substring(firstBrace, lastBrace + 1);
            return JSON.parse(jsonStr);
        }

        return { tool: "get_datos_personales", parameters: { legajo } };
    } catch (error) {
        console.error("[MCP] Error al seleccionar tool:", error);
        return { tool: "get_datos_personales", parameters: { legajo } };
    }
}

export async function summarizeWithLLM(params: {
    tool: string;
    data: any;
    userPrompt: string;
    model: string;
}): Promise<string> {
    const { data, userPrompt, model } = params;

    const systemPrompt = `Eres UadeBot, el asistente virtual de UADE. Responde al estudiante de forma amigable, clara y COMPACTA.

INSTRUCCIONES IMPORTANTES:
- Usá un formato de párrafos normales, NO uses saltos de línea excesivos
- Presentá la información de forma fluida y natural
- Si hay listas, usá viñetas simples (•) en líneas consecutivas
- NO dejes líneas en blanco entre items de una lista
- Sé conciso pero completo
- Tuteá al estudiante

Datos del sistema:`;

    const dataStr = JSON.stringify(data, null, 2);
    const fullPrompt = `${systemPrompt}\n\n${dataStr}\n\nPregunta del estudiante: "${userPrompt}"\n\nRespuesta (formato compacto):`;

    try {
        const response = await axios.post(`${ollamaUrl}/api/generate`, {
            model,
            prompt: fullPrompt,
            stream: false,
            keep_alive: DEFAULT_KEEP_ALIVE,
            options: {
                num_predict: 512,
                temperature: 0.7,
                num_thread: DEFAULT_NUM_THREAD,
            },
        });

        // Limpiar saltos de línea excesivos
        let cleanedResponse = response.data.response.trim();
        // Reemplazar 3 o más saltos de línea consecutivos por solo 2
        cleanedResponse = cleanedResponse.replace(/\n{3,}/g, '\n\n');
        
        return cleanedResponse;
    } catch (error) {
        console.error("[MCP] Error al generar resumen:", error);
        return "Lo siento, no pude generar una respuesta.";
    }
}
