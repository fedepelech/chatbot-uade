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
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
const DEFAULT_LLM_MODEL = process.env.LLM_MODEL || "llama3.2:3b-instruct-q4_K_M";
const DEFAULT_KEEP_ALIVE = process.env.LLM_KEEP_ALIVE || "1h";
const DEFAULT_NUM_PREDICT = Number(process.env.LLM_NUM_PREDICT || "512", 10);
const DEFAULT_NUM_THREAD = process.env.LLM_NUM_THREAD
    ? Number(process.env.LLM_NUM_THREAD, 10)
    : undefined;

const CONFIG_FILE_PATH = path.join(__dirname, "config/config.json");
const KNOWLEDGE_BASE_FILE_PATH = path.join(__dirname, "data/generic-faqs.json");

let globalClients: MCPClientWithTools[] = [];
let globalModelWithTools: ReturnType<ChatOllama["bindTools"]> | null = null;
let globalTools: Tool[] = [];
let globalVectorStore: any = null;
let globalRAGChain: any = null;

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

// ============================================
// RAG: CARGAR BASE DE CONOCIMIENTO SIMPLIFICADO
// ============================================

async function loadUADEKnowledge(filePath: string): Promise<Document[]> {
    console.log("📚 [RAG] Cargando base de conocimiento UADE...");
    
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const faqs = JSON.parse(content);
    
    // Simplificado: usar directamente la categoría del JSON
    const documents = faqs.map((faq: any, index: number) => {
        const combinedContent = `Pregunta: ${faq.pregunta}\n\nRespuesta: ${faq.respuesta}`;
        
        return new Document({
            pageContent: combinedContent,
            metadata: {
                id: `uade_faq_${String(index + 1).padStart(3, '0')}`,
                pregunta: faq.pregunta,
                respuesta: faq.respuesta,
                categoria: faq.categoria
            }
        });
    });
    
    console.log(`✅ [RAG] Cargadas ${documents.length} FAQs institucionales`);
    return documents;
}

// ============================================
// RAG: INDEXAR EN CHROMADB
// ============================================

async function initializeRAG(): Promise<{ vectorStore: any; ragChain: any }> {
    try {
        console.log("🔧 [RAG] Inicializando sistema RAG...");
        
        // 1. Cargar documentos
        const documents = await loadUADEKnowledge(KNOWLEDGE_BASE_FILE_PATH);
        
        // 2. Configurar embeddings
        const embeddings = new OllamaEmbeddings({
            baseUrl: ollamaUrl,
            model: "nomic-embed-text"
        });
        
        // 3. Crear vector store
        console.log("🔢 [RAG] Generando embeddings...");
        const vectorStore = await Chroma.fromDocuments(
            documents,
            embeddings,
            {
                collectionName: "uade_knowledge_base"
            }
        );
        
        // 4. Crear retriever
        const retriever = vectorStore.asRetriever({
            k: 3,
            searchType: "similarity"
        });
        
        // 5. Crear prompt template
        const promptTemplate = PromptTemplate.fromTemplate(`
Sos un asistente virtual de UADE. Respondé consultas GENERALES sobre la institución usando ÚNICAMENTE la información oficial proporcionada.

INFORMACIÓN INSTITUCIONAL DE UADE:
{context}

CONSULTA DEL ESTUDIANTE: {question}

INSTRUCCIONES:
1. Si la respuesta está en la información, respondé de forma clara y amigable
2. Usá tono cordial y profesional (tuteá al estudiante)
3. Si hay emails o teléfonos, incluílos
4. Si NO está la información, decí: "No tengo esa información específica. Te recomiendo contactar a la Oficina de Alumnos."
5. NO inventes información
6. Sé conciso (máximo 4-5 oraciones)

RESPUESTA:`);
        
        // 6. Crear RAG chain
        const llm = new ChatOllama({
            model: DEFAULT_LLM_MODEL,
            keepAlive: DEFAULT_KEEP_ALIVE,
            numThread: DEFAULT_NUM_THREAD,
            temperature: 0.3
        });
        
        const formatDocs = (docs: any[]) => {
            return docs.map((doc, i) => 
                `FAQ ${i + 1} [${doc.metadata.categoria}]:\nPregunta: ${doc.metadata.pregunta}\nRespuesta: ${doc.metadata.respuesta}`
            ).join("\n\n---\n\n");
        };
        
        const ragChain = RunnableSequence.from([
            {
                context: async (input: any) => {
                    const docs = await retriever._getRelevantDocuments(input.question);
                    return formatDocs(docs);
                },
                question: (input: any) => input.question
            },
            promptTemplate,
            llm,
            new StringOutputParser()
        ]);
        
        console.log("✅ [RAG] Sistema RAG inicializado correctamente");
        
        return { vectorStore, ragChain };
        
    } catch (error) {
        console.error("❌ [RAG] Error al inicializar RAG:", error);
        throw error;
    }
}

// ============================================
// ROUTER: DECIDIR ENTRE RAG O MCP
// ============================================

type QueryIntent = {
    type: 'rag' | 'mcp';
    confidence: number;
    reasoning: string;
};

async function detectQueryIntent(
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
                num_predict: 150,
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

// Fallback: detección por palabras clave
function detectIntentByKeywords(userPrompt: string): QueryIntent {
    const lowerPrompt = userPrompt.toLowerCase();
    
    // Patrones MCP (consultas personales)
    const mcpPatterns = [
        /\b(mi|mis)\s+(nota|promedio|materia|examen|deuda|cuenta|dato|beca|historial)/,
        /cu[aá]nto\s+(debo|adeudo)/,
        /tengo\s+(pendiente|aprobad|cursand)/,
        /mostr[aá](me|rme)\s+(mi|mis)/
    ];
    
    // Patrones RAG (consultas institucionales)
    const ragPatterns = [
        /horario\s+de\s+atenci[oó]n/,
        /\b(sede|campus|ubicaci[oó]n)\b/,
        /c[oó]mo\s+(me\s+)?(inscribo|hago|solicito|tramito)/,
        /qu[eé]\s+(es|son|ofrece|significa)/,
        /\b(preuade|minor|equivalencia|intercambio|beca)\b/
    ];
    
    // Verificar MCP
    for (const pattern of mcpPatterns) {
        if (pattern.test(lowerPrompt)) {
            return {
                type: 'mcp',
                confidence: 0.8,
                reasoning: 'Detectado patrón de consulta personal (keyword matching)'
            };
        }
    }
    
    // Verificar RAG
    for (const pattern of ragPatterns) {
        if (pattern.test(lowerPrompt)) {
            return {
                type: 'rag',
                confidence: 0.8,
                reasoning: 'Detectado patrón de consulta institucional (keyword matching)'
            };
        }
    }
    
    // Default: si contiene "mi/mis" -> MCP, sino -> RAG
    if (/\b(mi|mis)\b/.test(lowerPrompt)) {
        return {
            type: 'mcp',
            confidence: 0.6,
            reasoning: 'Posesivos detectados, probablemente consulta personal'
        };
    }
    
    return {
        type: 'rag',
        confidence: 0.5,
        reasoning: 'No se detectaron patrones claros, asumiendo consulta general'
    };
}

// ============================================
// RAG: EJECUTAR CONSULTA
// ============================================

async function executeRAGQuery(userPrompt: string): Promise<string> {
    if (!globalRAGChain) {
        return "Lo siento, el sistema de información institucional no está disponible en este momento.";
    }
    
    try {
        console.log("[RAG] Ejecutando consulta institucional:", userPrompt);
        const response = await globalRAGChain.invoke({ question: userPrompt });
        console.log("[RAG] Respuesta generada exitosamente");
        return response;
    } catch (error) {
        console.error("[RAG] Error al ejecutar consulta:", error);
        return "Lo siento, ocurrió un error al procesar tu consulta institucional.";
    }
}

// ============================================
// MCP: FUNCIONES EXISTENTES
// ============================================

async function createClientAndGetTools(
    name: string,
    mcpConfig: { command: string; args: string[] }
): Promise<MCPClientWithTools> {
    const client = new Client({
        name,
        version: "1.0.0",
    });

    try {
        const transport = new StdioClientTransport({
            command: mcpConfig.command,
            args: mcpConfig.args,
        });

        await client.connect(transport);
        const { tools } = await client.listTools();

        console.log(`Hay ${tools.length} herramientas MCP disponibles`);

        return { client, tools: tools as unknown as LoadedTool[] };
    } catch (error) {
        console.error("Error al obtener herramientas MCP:", error);
        throw error;
    }
}

async function loadServers(): Promise<IGetTools> {
    const rawData = fs.readFileSync(CONFIG_FILE_PATH, "utf8");
    const config: MCPConfig = JSON.parse(rawData);

    const clients: Array<MCPClientWithTools> = [];
    const allTools: Tool[] = [];

    for (const [server, params] of Object.entries(config.mcpServers)) {
        const { client, tools } = await createClientAndGetTools(
            server, 
            params as { command: string; args: string[] }
        );
        clients.push({ client, tools });
        allTools.push(...(tools as unknown as Tool[]));
    }

    return { clients, allTools };
}

async function warmUpLLM(tools?: Tool[]) {
    const maxAttempts = Number.parseInt(process.env.LLM_WARMUP_ATTEMPTS || "8", 10);
    const delayMs = Number.parseInt(process.env.LLM_WARMUP_DELAY_MS || "2000", 10);
    const warmOptions: WarmLLMOptions = { num_predict: 8 };
    if (DEFAULT_NUM_THREAD) warmOptions.num_thread = DEFAULT_NUM_THREAD;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            if (tools && tools.length > 0) {
                const model = new ChatOllama({
                    model: DEFAULT_LLM_MODEL,
                    keepAlive: DEFAULT_KEEP_ALIVE,
                    numThread: DEFAULT_NUM_THREAD,
                });
                const modelWithTools = model.bindTools(tools);
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

async function selectToolWithLLM(
    userPrompt: string,
    model: string,
    legajo: string
): Promise<{ tool: string; parameters: any }> {
    const tools = globalTools.length > 0 ? globalTools : [];

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

async function executeToolHandler(
    toolName: string,
    parameters: any
): Promise<{ statusCode: number; data: any }> {
    console.log(`[MCP] Ejecutando tool: ${toolName}`, parameters);

    try {
        let targetClient = null;
        for (const clientWithTools of globalClients) {
            const hasTool = clientWithTools.tools.some((t) => t.name === toolName);
            if (hasTool) {
                targetClient = clientWithTools.client;
                break;
            }
        }

        if (!targetClient) {
            return {
                statusCode: 404,
                data: { error: true, message: `Tool '${toolName}' no encontrada` },
            };
        }

        const result = await targetClient.callTool({
            name: toolName,
            arguments: parameters || {},
        });

        return {
            statusCode: 200,
            data: {
                tool: toolName,
                result: result.content,
                isError: result.isError || false,
            },
        };
    } catch (error: any) {
        console.error(`[MCP] Error ejecutando tool:`, error);
        return {
            statusCode: 500,
            data: { error: true, message: error.message },
        };
    }
}

async function summarizeWithLLM(params: {
    tool: string;
    data: any;
    userPrompt: string;
    model: string;
}): Promise<string> {
    const { data, userPrompt, model } = params;

    const systemPrompt = `Eres UadeBot. Responde al estudiante de forma amigable y clara basándote en los datos del sistema.

Datos:`;

    const dataStr = JSON.stringify(data, null, 2);
    const fullPrompt = `${systemPrompt}\n\n${dataStr}\n\nPregunta: "${userPrompt}"\n\nRespuesta:`;

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
        console.error("[MCP] Error al generar resumen:", error);
        return "Lo siento, no pude generar una respuesta.";
    }
}

// ============================================
// ENDPOINT PRINCIPAL HÍBRIDO
// ============================================

app.post("/mcp", async (req, res) => {
    try {
        const { payload } = req.body;
        const model = payload?.model || DEFAULT_LLM_MODEL;
        const userPrompt = payload?.userPrompt || payload?.prompt || "";
        const legajo = payload?.legajo || "";

        if (!userPrompt) {
            return res.status(400).json({ error: "Missing userPrompt" });
        }

        console.log(`\n${"=".repeat(60)}`);
        console.log(`[HYBRID] Nueva consulta: "${userPrompt}"`);
        console.log(`[HYBRID] Legajo: ${legajo || "N/A"}`);

        // 1. ROUTER: Detectar intención
        const intent = await detectQueryIntent(userPrompt, model);
        console.log(`[HYBRID] Intención: ${intent.type.toUpperCase()} (confianza: ${intent.confidence})`);

        // 2. EJECUTAR SEGÚN INTENCIÓN
        if (intent.type === 'rag') {
            console.log("[HYBRID] Usando sistema RAG");
            
            const ragResponse = await executeRAGQuery(userPrompt);
            
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
            console.log("[HYBRID] Usando MCP Tools");
            
            if (!legajo) {
                return res.status(400).json({ 
                    error: "Se requiere legajo para consultas personales" 
                });
            }
            
            const selectedTool = await selectToolWithLLM(userPrompt, model, legajo);
            console.log(`[HYBRID] Tool seleccionada: ${selectedTool.tool}`);
            
            const { statusCode, data: rawData } = await executeToolHandler(
                selectedTool.tool,
                selectedTool.parameters
            );
            
            const summaryText = await summarizeWithLLM({
                tool: selectedTool.tool,
                data: rawData,
                userPrompt,
                model,
            });
            
            return res.status(statusCode).json({
                queryType: 'mcp',
                intent: intent,
                tool: selectedTool.tool,
                parameters: selectedTool.parameters,
                data: rawData,
                summaryText,
            });
        }
        
    } catch (err: any) {
        console.error("[HYBRID] Error:", err);
        res.status(500).json({ error: err.message || "Error interno" });
    }
});

// ============================================
// INICIALIZACIÓN
// ============================================

async function initialize() {
    try {
        const { clients, allTools } = await loadServers();
        globalClients = clients;
        globalTools = allTools;
        console.log(`[INIT] ${allTools.length} tools MCP cargadas`);

        const { vectorStore, ragChain } = await initializeRAG();
        globalVectorStore = vectorStore;
        globalRAGChain = ragChain;
        console.log("[INIT] Sistema RAG inicializado");

        await warmUpLLM(allTools);

        const model = new ChatOllama({
            model: DEFAULT_LLM_MODEL,
            keepAlive: DEFAULT_KEEP_ALIVE,
            numThread: DEFAULT_NUM_THREAD,
        });

        globalModelWithTools = model.bindTools(allTools);

        console.log("\n✅ [INIT] Sistema híbrido RAG + MCP listo\n");
        console.log(`   📚 RAG: Consultas institucionales`);
        console.log(`   🔧 MCP: ${allTools.length} tools para consultas personales\n`);

        return { model: globalModelWithTools, tools: allTools, clients };
    } catch (error) {
        console.error("[INIT] Error en inicialización:", error);
        throw error;
    }
}

app.get("/health", (req, res) => {
    res.json({ 
        status: "ok",
        rag: globalRAGChain !== null,
        mcp_tools: globalTools.length
    });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor híbrido RAG + MCP corriendo en puerto ${PORT}`);
    setTimeout(() => {
        initialize().catch((err) => {
            console.error("Error fatal en inicialización:", err);
            process.exit(1);
        });
    }, 1000);
});
