import express from "express";
import cors from "cors";
import axios, { AxiosError } from "axios";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import {
    IGetTools,
    LoadedTool,
    MCPClientWithTools,
    MCPConfig,
    WarmLLMOptions,
} from "./types.js";
import { Tool } from "@langchain/core/tools";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
// Configuración LLM por defecto (modelo rápido y ligero)
const DEFAULT_LLM_MODEL =
    process.env.LLM_MODEL || "llama3.2:3b-instruct-q4_K_M";
const DEFAULT_KEEP_ALIVE = process.env.LLM_KEEP_ALIVE || "1h";
const DEFAULT_NUM_PREDICT = Number(process.env.LLM_NUM_PREDICT || "512", 10);
const DEFAULT_NUM_THREAD = process.env.LLM_NUM_THREAD
    ? Number(process.env.LLM_NUM_THREAD, 10)
    : undefined;
console.log("__dirname ", __dirname);
const CONFIG_FILE_PATH = path.join(__dirname, "config/config.json");
let globalClients: MCPClientWithTools[] = [];
let globalModelWithTools: ReturnType<ChatOllama["bindTools"]> | null = null;
let globalTools: Tool[] = [];

const app = express();

// Middlewares
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.use(express.json());
app.options("*", cors());

// DEPRECATED: Ahora se usan las tools cargadas desde MCP (globalTools)
// Mantenido como fallback si no hay tools disponibles
const AVAILABLE_TOOLS = [
    {
        name: "answer_question",
        description: "Responde preguntas generales del usuario",
        parameters: {},
    },
];

/**
 * Método que crea el cliente y obtiene sus tools
 * @param name
 * @param mcpConfig
 * @param mcpConfig.command
 * @param mcpConfig.args
 */
async function createClientAndGetTools(
    name: string,
    mcpConfig: { command: string; args: string[] }
): Promise<MCPClientWithTools> {
    const client = new Client({
        name,
        version: "1.0.0",
    });

    try {
        // Se configura transporte stdio
        const transport = new StdioClientTransport({
            command: mcpConfig.command,
            args: mcpConfig.args,
        });

        // Se conecta al servidor
        await client.connect(transport);
        // Se listan herramientas disponibles
        const { tools } = await client.listTools();

        console.log(`Hay ${tools.length} herramientas disponibles`);

        return { client, tools: tools as unknown as LoadedTool[] };
    } catch (error) {
        console.error("Error al obtener herramientas:", error);
        throw error;
    }
}

/**
 * Método que obtiene las herramientas de los servers y las combina en un array.
 * @returns { { clients: Client[], allTools: Tool[] } }
 */
async function loadServers(): Promise<IGetTools> {
    // Cargar configuración
    const rawData = fs.readFileSync(CONFIG_FILE_PATH, "utf8");
    const config: MCPConfig = JSON.parse(rawData);

    const clients: Array<MCPClientWithTools> = [];
    const allTools: Tool[] = [];

    for (const [server, params] of Object.entries(config.mcpServers)) {
        const { client, tools } = await createClientAndGetTools(server, params as { command: string; args: string[] });
        clients.push({ client, tools });
        allTools.push(...(tools as unknown as Tool[]));
    }

    return { clients, allTools };
}

async function warmUpLLM(tools?: Tool[]) {
    const maxAttempts = Number.parseInt(
        process.env.LLM_WARMUP_ATTEMPTS || "8",
        10
    );
    const delayMs = Number.parseInt(
        process.env.LLM_WARMUP_DELAY_MS || "2000",
        10
    );
    const warmOptions: WarmLLMOptions = { num_predict: 8 };
    if (DEFAULT_NUM_THREAD) warmOptions.num_thread = DEFAULT_NUM_THREAD;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // Si hay tools disponibles, usar ChatOllama con bindTools
            if (tools && tools.length > 0) {
                const model = new ChatOllama({
                    model: DEFAULT_LLM_MODEL,
                    keepAlive: DEFAULT_KEEP_ALIVE,
                    numThread: DEFAULT_NUM_THREAD,
                });
                const modelWithTools = model.bindTools(tools);

                // Hacer una invocación simple para warm-up
                await modelWithTools.invoke("ok");
                console.log(
                    `[LLM] Modelo precalentado con ${tools.length} tools: ${DEFAULT_LLM_MODEL} (keep_alive=${DEFAULT_KEEP_ALIVE})`
                );
            } else {
                // Fallback a la API directa si no hay tools
                await axios.post(`${ollamaUrl}/api/generate`, {
                    model: DEFAULT_LLM_MODEL,
                    prompt: "ok",
                    stream: false,
                    keep_alive: DEFAULT_KEEP_ALIVE,
                    options: warmOptions,
                });
                console.log(
                    `[LLM] Modelo precalentado: ${DEFAULT_LLM_MODEL} (keep_alive=${DEFAULT_KEEP_ALIVE})`
                );
            }
            return;
        } catch (e) {
            const error = e as AxiosError;
            const status = error.response?.status;
            const data = error.response?.data;
            const str = typeof data === "string" ? data : JSON.stringify(data || {});
            const isModelMissing =
                status === 404 ||
                /model/i.test(str) ||
                /not found|no such model/i.test(str);

            if (isModelMissing) {
                try {
                    console.log(
                        `[LLM] Modelo no encontrado. Intentando pull: ${DEFAULT_LLM_MODEL} ...`
                    );
                    await axios.post(`${ollamaUrl}/api/pull`, {
                        name: DEFAULT_LLM_MODEL,
                        stream: false,
                    });
                    console.log("[LLM] Pull completado. Reintentando warm-up...");
                } catch (pullErr) {
                    console.warn(
                        "[LLM] Falló el pull del modelo:",
                        (pullErr as Error)?.message || pullErr
                    );
                }
            } else {
                console.warn(
                    `[LLM] Warm-up intento ${attempt}/${maxAttempts} falló:`,
                    (e as Error)?.message || status
                );
            }

            if (attempt < maxAttempts) {
                await new Promise((r) => setTimeout(r, delayMs));
            }
        }
    }
    console.warn(
        "[LLM] Warm-up no pudo completarse tras múltiples intentos. Continuando sin precalentamiento."
    );
}

// Función para que el LLM seleccione la herramienta apropiada
async function selectToolWithLLM(
    userPrompt: string,
    model: string,
    legajo: string
): Promise<{ tool: string; parameters: any }> {
    // Usar las tools cargadas desde MCP en lugar de AVAILABLE_TOOLS hardcodeado
    const tools = globalTools.length > 0 ? globalTools : AVAILABLE_TOOLS;

    console.log(
        `[SELECT_TOOL] Usando ${tools.length} tools disponibles para selección`
    );

    const toolsDescription = tools
        .map((t: any) => {
            const name = t.name || "";
            const description = t.description || "";
            const schema = t.schema || t.inputSchema || {};
            const properties = schema.properties || {};

            return `- ${name}: ${description}${Object.keys(properties).length > 0
                    ? " Parámetros: " + JSON.stringify(properties)
                    : ""
                }`;
        })
        .join("\n");

    const systemPrompt = `Eres UadeBot, un asistente virtual de la Universidad Argentina de la Empresa (UADE).
Tu función es ayudar a los estudiantes respondiendo consultas sobre su información académica, administrativa y personal.

Herramientas disponibles:
${toolsDescription}

Instrucciones:
1. Analiza la consulta del estudiante
2. Identifica qué tipo de información necesita (datos personales, académicos, financieros, etc.)
3. Selecciona la herramienta más apropiada para obtener esa información
4. El parámetro "legajo" siempre debe ser el número de legajo del estudiante
5. Responde ÚNICAMENTE con un JSON válido en este formato exacto:
{
  "tool": "nombre_de_la_herramienta",
  "parameters": {"legajo": "numero_legajo"}
}

Ejemplos de consultas de estudiantes:

Usuario: "¿Cuánto debo de la cuota?"
Respuesta: {"tool": "get_cuenta_corriente", "parameters": {"legajo": "123456"}}

Usuario: "¿Cuál es mi email institucional?"
Respuesta: {"tool": "get_datos_personales", "parameters": {"legajo": "123456"}}

Usuario: "¿Qué materias estoy cursando este cuatrimestre?"
Respuesta: {"tool": "get_cursada_actual", "parameters": {"legajo": "123456"}}

Usuario: "¿Tengo exámenes pendientes?"
Respuesta: {"tool": "get_examenes_pendientes", "parameters": {"legajo": "123456"}}

Usuario: "¿Cuál es mi promedio?"
Respuesta: {"tool": "get_datos_carrera", "parameters": {"legajo": "123456"}}

Usuario: "¿Qué materias aprobé?"
Respuesta: {"tool": "get_historial_academico", "parameters": {"legajo": "123456"}}

Usuario: "¿Tengo alguna beca?"
Respuesta: {"tool": "get_becas", "parameters": {"legajo": "123456"}}

Usuario: "¿Cuánto me falta para recibirme?"
Respuesta: {"tool": "get_titulos", "parameters": {"legajo": "123456"}}

Usuario: "¿Cuándo fue mi último acceso al sistema?"
Respuesta: {"tool": "get_datos_sistema", "parameters": {"legajo": "123456"}}

IMPORTANTE: El legajo del estudiante que está consultando es: ${legajo}
Siempre usa este legajo exacto en el parámetro "legajo" de tu respuesta.

Ahora procesa esta consulta del estudiante:`;

    const fullPrompt = `${systemPrompt}\n\nUsuario: "${userPrompt}"\nRespuesta:`;

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
        console.log("[LLM] Tool selection response:", llmResponse);

        // Intentar extraer JSON de la respuesta
        // Buscar el primer { y el último } para capturar JSON completo
        const firstBrace = llmResponse.indexOf('{');
        const lastBrace = llmResponse.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonStr = llmResponse.substring(firstBrace, lastBrace + 1);
            try {
                const parsed = JSON.parse(jsonStr);
                return parsed;
            } catch (parseError) {
                console.error("[LLM] Error al parsear JSON:", parseError);
                console.error("[LLM] JSON extraído:", jsonStr);
            }
        }

        // Si no se pudo parsear, usar answer_question por defecto
        console.warn(
            "[LLM] No se pudo parsear la respuesta, usando answer_question por defecto"
        );
        return { tool: "answer_question", parameters: {} };
    } catch (error) {
        console.error("[LLM] Error al seleccionar herramienta:", error);
        return { tool: "answer_question", parameters: {} };
    }
}

// Función para ejecutar la herramienta seleccionada usando MCP
async function executeToolHandler(
  toolName: string,
  parameters: any
): Promise<{ statusCode: number; data: any }> {
  console.log(`[EXECUTE_TOOL] Ejecutando tool: ${toolName}`, parameters);

  try {
    // Buscar la tool en globalTools
    const tool = globalTools.find((t: any) => t.name === toolName);
    
    if (!tool) {
      console.warn(`[EXECUTE_TOOL] Tool no encontrada: ${toolName}`);
      return {
        statusCode: 404,
        data: {
          error: true,
          message: `Tool '${toolName}' no encontrada`,
          availableTools: globalTools.map((t: any) => t.name),
        },
      };
    }

    // Buscar el cliente MCP que tiene esta tool
    let targetClient = null;
    for (const clientWithTools of globalClients) {
      const hasTool = clientWithTools.tools.some((t) => t.name === toolName);
      if (hasTool) {
        targetClient = clientWithTools.client;
        break;
      }
    }

    if (!targetClient) {
      console.error(`[EXECUTE_TOOL] No se encontró cliente MCP para tool: ${toolName}`);
      return {
        statusCode: 500,
        data: {
          error: true,
          message: `No se encontró cliente MCP para la tool '${toolName}'`,
        },
      };
    }

    // Invocar la tool usando el cliente MCP
    console.log(`[EXECUTE_TOOL] Invocando tool '${toolName}' en cliente MCP`);
    const result = await targetClient.callTool({
      name: toolName,
      arguments: parameters || {},
    });

    console.log(`[EXECUTE_TOOL] Tool ejecutada exitosamente: ${toolName}`);
    
    return {
      statusCode: 200,
      data: {
        tool: toolName,
        result: result.content,
        isError: result.isError || false,
      },
    };
  } catch (error: any) {
    console.error(`[EXECUTE_TOOL] Error ejecutando tool '${toolName}':`, error);
    return {
      statusCode: 500,
      data: {
        error: true,
        tool: toolName,
        message: error.message || "Error desconocido al ejecutar la tool",
      },
    };
  }
}

// Función para generar resumen con el LLM
async function summarizeWithLLM(params: {
    tool: string;
    data: any;
    userPrompt: string;
    model: string;
    originTool?: string;
}): Promise<string> {
    const { tool, data, userPrompt, model, originTool } = params;

    const systemPrompt = `Eres UadeBot, el asistente virtual de la Universidad Argentina de la Empresa (UADE).

Instrucciones:
1. Responde directamente a la pregunta del estudiante sin presentarte
2. Usa el nombre del estudiante si está disponible (solo el nombre, no apellidos)
3. Sé conciso, claro y amigable (tuteo)
4. Organiza la información de forma estructurada y fácil de leer
5. Usa emojis ocasionalmente (máximo 2-3 por respuesta)
6. Si hay deudas o problemas, sé empático pero claro
7. Si hay logros (buen promedio, becas), felicita brevemente
8. NO te presentes como "asesor" ni inventes un nombre
9. Termina con una pregunta breve si es pertinente (ej: "¿Necesitás algo más?")

Datos del sistema:`;

    const dataStr = JSON.stringify(data, null, 2);
    const fullPrompt = `${systemPrompt}\n\n${dataStr}\n\nPregunta del usuario: "${userPrompt}"\n\nRespuesta:`;

    try {
        const response = await axios.post(`${ollamaUrl}/api/generate`, {
            model,
            prompt: fullPrompt,
            stream: false,
            keep_alive: DEFAULT_KEEP_ALIVE,
            options: {
                num_predict: DEFAULT_NUM_PREDICT,
                temperature: 0.7,
                num_thread: DEFAULT_NUM_THREAD,
            },
        });

        return response.data.response.trim();
    } catch (error) {
        console.error("[LLM] Error al generar resumen:", error);
        return "Lo siento, no pude generar una respuesta en este momento.";
    }
}

// MCP endpoint - Nuevo flujo basado en IA
app.post("/mcp", async (req, res) => {
    try {
        console.log("HEADERS:", req.headers);
        console.log("BODY:", req.body);

        const { payload } = req.body;
        const model = payload?.model || DEFAULT_LLM_MODEL;
        const userPrompt = payload?.userPrompt || payload?.prompt || "";
        const legajo = payload?.legajo || "";

        // Validar que haya un prompt del usuario
        if (!userPrompt) {
            return res.status(400).json({ error: "Missing userPrompt in payload" });
        }

        // Validar que haya un legajo
        if (!legajo) {
            return res.status(400).json({ error: "Missing legajo in payload" });
        }

        console.log(`[MCP] Procesando prompt del usuario: "${userPrompt}" para legajo: ${legajo}`);

        // 1. El LLM selecciona la herramienta apropiada basándose en el prompt
        const selectedTool = await selectToolWithLLM(userPrompt, model, legajo);
        console.log(
            `[MCP] Herramienta seleccionada por IA: ${selectedTool.tool}`,
            selectedTool.parameters
        );

        // 2. Ejecutar la herramienta seleccionada
        const { statusCode, data: rawData } = await executeToolHandler(
            selectedTool.tool,
            selectedTool.parameters
        );
        console.log(`[MCP] Herramienta ejecutada con código: ${statusCode}`);

        // 3. Generar resumen con el LLM
        const summaryText = await summarizeWithLLM({
            tool: selectedTool.tool,
            data: rawData,
            userPrompt,
            model,
            originTool: selectedTool.tool,
        });

        // 4. Retornar respuesta
        return res.status(statusCode).json({
            tool: selectedTool.tool,
            parameters: selectedTool.parameters,
            data: rawData,
            summaryText,
        });
    } catch (err: any) {
        console.error("[MCP] Error en endpoint:", err);
        res
            .status(500)
            .json({ error: err.message || "Error interno del servidor" });
    }
});

async function initialize() {
    // 1. Cargar los servidores MCP y sus tools
    const { clients, allTools } = await loadServers();
    globalClients = clients;
    globalTools = allTools;

    console.log(
        `[INIT] Cargadas ${allTools.length} tools de ${clients.length} servidores MCP`
    );

    // 2. Hacer warm-up del modelo con las tools
    await warmUpLLM(allTools);

    // 3. Crear y configurar el modelo con las tools
    const model = new ChatOllama({
        model: DEFAULT_LLM_MODEL,
        keepAlive: DEFAULT_KEEP_ALIVE,
        numThread: DEFAULT_NUM_THREAD,
    });

    globalModelWithTools = model.bindTools(allTools);

    console.log(
        `[INIT] Modelo inicializado con ${allTools.length} tools disponibles`
    );

    const embeddings = new OllamaEmbeddings({
        baseUrl: "http://localhost:11434",
        model: "nomic-embed-text"
      });
    return { model: globalModelWithTools, tools: allTools, clients };
}

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`MCP server running on port ${PORT}`);
    // Precalentar el modelo con reintentos y auto-pull para evitar latencia y 404 en primer arranque
    setTimeout(() => {
        initialize().catch(() => { });
    }, 1000);
});
