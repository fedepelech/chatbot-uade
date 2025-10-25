import axios from "axios";
import { ollamaUrl, DEFAULT_KEEP_ALIVE, DEFAULT_NUM_THREAD } from "../../config/environment.js";
import { detectIntentByKeywords } from "./keywordDetector.js";
import type { QueryIntent } from "../../types/index.js";

export async function detectQueryIntent(
    userPrompt: string,
    model: string
): Promise<QueryIntent> {
    const systemPrompt = `Sos un clasificador de consultas para UadeBot, el asistente virtual de UADE.

Tu tarea es determinar si la consulta del estudiante es:

**TIPO RAG (consulta GENERAL sobre la institución)**:
- Preguntas sobre horarios de atención
- Información sobre sedes y ubicaciones
- Consultas sobre el proceso de ingreso (Pre-UADE, requisitos, documentos)
- Información sobre carreras ofrecidas
- Políticas generales de la universidad
- Becas y aranceles generales
- Información sobre intercambios
- Trámites administrativos generales (cómo hacer certificados, equivalencias)
- Preguntas sobre WebCampus (qué es, cómo usarlo)
- Cualquier pregunta que NO requiera datos específicos del estudiante

**TIPO MCP (consulta PERSONAL del estudiante)**:
- "Mi" cuenta corriente / deuda personal
- "Mis" materias actuales que estoy cursando
- "Mi" promedio académico personal
- "Mis" notas o exámenes específicos
- "Mi" historial académico
- "Mis" datos personales (email, teléfono, dirección)
- "Mi" situación de becas personales
- "Mi" información de títulos
- Cualquier pregunta que requiera el legajo del estudiante

Ejemplos TIPO RAG:
- "¿Cuál es el horario de atención?"
- "¿Dónde están las sedes de UADE?"
- "¿Cómo me inscribo al Pre-UADE?"
- "¿Qué becas ofrece UADE?"
- "¿Qué son los Minors?"
- "¿Cómo hago equivalencias?"

Ejemplos TIPO MCP:
- "¿Cuánto debo?"
- "¿Cuáles son mis materias?"
- "¿Cuál es mi promedio?"
- "¿Tengo exámenes pendientes?"
- "Mostrame mis notas"

Responde SOLO con un JSON válido:
{
  "type": "rag" o "mcp",
  "confidence": número entre 0 y 1,
  "reasoning": "breve explicación"
}

Consulta a clasificar:`;

    const fullPrompt = `${systemPrompt}\n\n"${userPrompt}"\n\nRespuesta JSON:`;

    try {
        const response = await axios.post(`${ollamaUrl}/api/generate`, {
            model,
            prompt: fullPrompt,
            stream: false,
            keep_alive: DEFAULT_KEEP_ALIVE,
            options: {
                // max cantidad de tokens a devolver
                num_predict: 150,
                // respuesta estable casi sin variabilidad
                temperature: 0.1,
                num_thread: DEFAULT_NUM_THREAD,
            },
        });

        const llmResponse = response.data.response.trim();
        console.log("[ROUTER] Intent detection response:", llmResponse);

        const firstBrace = llmResponse.indexOf('{');
        const lastBrace = llmResponse.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonStr = llmResponse.substring(firstBrace, lastBrace + 1);
            const parsed = JSON.parse(jsonStr);
            
            console.log(`[ROUTER] Intención detectada: ${parsed.type} (confidence: ${parsed.confidence})`);
            console.log(`[ROUTER] Razonamiento: ${parsed.reasoning}`);
            
            return {
                type: parsed.type === 'rag' ? 'rag' : 'mcp',
                confidence: parsed.confidence || 0.5,
                reasoning: parsed.reasoning || ''
            };
        }

        console.warn("[ROUTER] No se pudo parsear JSON, usando detección por keywords");
        return detectIntentByKeywords(userPrompt);
        
    } catch (error) {
        console.error("[ROUTER] Error en detección de intención:", error);
        return detectIntentByKeywords(userPrompt);
    }
}
