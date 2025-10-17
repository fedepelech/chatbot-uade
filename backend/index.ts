import express from 'express';
import cors from 'cors';
import axios, { AxiosError } from 'axios';

const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
const monolitoUrl = process.env.MONOLITO_URL || 'http://localhost:3000';
// Configuración LLM por defecto (modelo rápido y ligero)
const DEFAULT_LLM_MODEL = process.env.LLM_MODEL || 'llama3.2:3b-instruct-q4_K_M';
const DEFAULT_KEEP_ALIVE = process.env.LLM_KEEP_ALIVE || '1h';
const DEFAULT_NUM_PREDICT = parseInt(process.env.LLM_NUM_PREDICT || '512', 10);
const DEFAULT_NUM_THREAD = process.env.LLM_NUM_THREAD ? parseInt(process.env.LLM_NUM_THREAD, 10) : undefined;

const CONFIG_FOLDER_PATH = process.env.NODE_ENV === 'production' ? path.join(path.resolve(), '../../etc/plugins/flexia') : path.join(path.resolve(), '/etc/plugins/flexia');
const CONFIG_FILE_PATH = path.join(CONFIG_FOLDER_PATH, 'config.json');

const app = express();

// Middlewares
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.options('*', cors());

// Definición de herramientas disponibles para el LLM
const AVAILABLE_TOOLS = [
    {
        name: 'process_pending_transactions',
        description: 'Procesa transacciones pendientes en el sistema. Útil cuando el usuario pregunta por transacciones pendientes o quiere procesarlas.',
        parameters: {}
    },
    {
        name: 'force_close_shifts',
        description: 'Fuerza el cierre de turnos abiertos. Usar cuando el usuario quiere cerrar turnos o hay problemas con turnos sin cerrar.',
        parameters: {}
    },
    {
        name: 'close_business_day',
        description: 'Cierra el día de negocio. Usar cuando el usuario quiere cerrar el día o finalizar operaciones del día.',
        parameters: {
            date: 'Fecha del día a cerrar (por defecto "today")',
            forceClosure: 'Booleano para forzar el cierre (por defecto false)'
        }
    },
    {
        name: 'read_local_logs',
        description: 'Lee los logs locales del sistema. Usar cuando el usuario pregunta por errores, logs o quiere revisar el historial de eventos.',
        parameters: {
            lines: 'Número de líneas a leer (por defecto 50)'
        }
    },
    {
        name: 'get_sales_data',
        description: 'Obtiene datos de ventas del día. Usar cuando el usuario pregunta por ventas, ingresos o estadísticas comerciales.',
        parameters: {
            businessDay: 'Día de negocio (por defecto "today")'
        }
    },
    {
        name: 'get_business_day_status',
        description: 'Obtiene el estado del día de negocio. Usar cuando el usuario pregunta por el estado del día, si está abierto o cerrado.',
        parameters: {
            date: 'Fecha a consultar (por defecto "today")'
        }
    },
    {
        name: 'check_closure_status',
        description: 'Verifica el estado de cierre del sistema. Usar cuando el usuario pregunta si se puede cerrar el día o qué falta para cerrar.',
        parameters: {
            businessDay: 'Día de negocio (por defecto "today")'
        }
    },
    {
        name: 'answer_question',
        description: 'Responde preguntas generales o conversacionales que no requieren ejecutar ninguna herramienta específica. Usar para saludos, preguntas sobre el sistema en general, o cuando no hay una acción específica a realizar.',
        parameters: {}
    }
];

/**
 * Método que obtiene las herramientas de los servers y las combina en un array.
 * @returns { { clients: Client[], allTools: Tool[] } }
 */
async function loadServers (): Promise<IGetTools> {
    // Cargar configuración
    const rawData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    const config: MCPConfig = JSON.parse(rawData);
  
    const clients: Array<MCPClientWithTools> = [];
    const allTools: Tool[] = [];
  
    for (const [server, params] of Object.entries(config.mcpServers)) {
      const { client, tools } = await createClientAndGetTools(server, params);
      clients.push({ client, tools });
      allTools.push(...(tools as unknown as Tool[]));
    }
  
    return { clients, allTools };
  }

async function warmUpLLM() {
    const maxAttempts = parseInt(process.env.LLM_WARMUP_ATTEMPTS || '8', 10);
    const delayMs = parseInt(process.env.LLM_WARMUP_DELAY_MS || '2000', 10);
    const warmOptions: WarmLLMOptions = { num_predict: 8 };
    if (DEFAULT_NUM_THREAD) warmOptions.num_thread = DEFAULT_NUM_THREAD;
    const { allTools, clients } = await loadServers();
    globalClients = clients;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await axios.post(`${ollamaUrl}/api/generate`, {
                model: DEFAULT_LLM_MODEL,
                prompt: 'ok',
                stream: false,
                keep_alive: DEFAULT_KEEP_ALIVE,
                options: warmOptions
            });
            console.log(`[LLM] Modelo precalentado: ${DEFAULT_LLM_MODEL} (keep_alive=${DEFAULT_KEEP_ALIVE})`);
            return;
        } catch (e) {
            const error = e as AxiosError;
            const status = error.response?.status;
            const data = error.response?.data;
            const str = typeof data === 'string' ? data : JSON.stringify(data || {});
            const isModelMissing = status === 404 || /model/i.test(str) || /not found|no such model/i.test(str);

            if (isModelMissing) {
                try {
                    console.log(`[LLM] Modelo no encontrado. Intentando pull: ${DEFAULT_LLM_MODEL} ...`);
                    await axios.post(`${ollamaUrl}/api/pull`, { name: DEFAULT_LLM_MODEL, stream: false });
                    console.log('[LLM] Pull completado. Reintentando warm-up...');
                } catch (pullErr) {
                    console.warn('[LLM] Falló el pull del modelo:', (pullErr as Error)?.message || pullErr);
                }
            } else {
                console.warn(`[LLM] Warm-up intento ${attempt}/${maxAttempts} falló:`, (e as Error)?.message || status);
            }

            if (attempt < maxAttempts) {
                await new Promise(r => setTimeout(r, delayMs));
            }
        }
    }
    console.warn('[LLM] Warm-up no pudo completarse tras múltiples intentos. Continuando sin precalentamiento.');
}

// Función para que el LLM seleccione la herramienta apropiada
async function selectToolWithLLM(userPrompt: string, model: string): Promise<{ tool: string; parameters: any }> {
    const toolsDescription = AVAILABLE_TOOLS.map(t => 
        `- ${t.name}: ${t.description}${Object.keys(t.parameters).length > 0 ? ' Parámetros: ' + JSON.stringify(t.parameters) : ''}`
    ).join('\n');

    const systemPrompt = `Eres un asistente que selecciona la herramienta más apropiada para responder a las solicitudes del usuario.

Herramientas disponibles:
${toolsDescription}

Instrucciones:
1. Analiza la solicitud del usuario
2. Selecciona la herramienta más apropiada
3. Extrae los parámetros necesarios del mensaje del usuario
4. Responde ÚNICAMENTE con un JSON válido en este formato exacto:
{
  "tool": "nombre_de_la_herramienta",
  "parameters": {}
}

Ejemplos:
Usuario: "¿Cuánto vendimos hoy?"
Respuesta: {"tool": "get_sales_data", "parameters": {"businessDay": "today"}}

Usuario: "Cierra el día de hoy"
Respuesta: {"tool": "close_business_day", "parameters": {"date": "today", "forceClosure": false}}

Usuario: "Hola, ¿cómo estás?"
Respuesta: {"tool": "answer_question", "parameters": {}}

Ahora procesa esta solicitud del usuario:`;

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
                num_thread: DEFAULT_NUM_THREAD
            }
        });

        const llmResponse = response.data.response.trim();
        console.log('[LLM] Tool selection response:', llmResponse);

        // Intentar extraer JSON de la respuesta
        const jsonMatch = llmResponse.match(/\{[^}]+\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed;
        }

        // Si no se pudo parsear, usar answer_question por defecto
        console.warn('[LLM] No se pudo parsear la respuesta, usando answer_question por defecto');
        return { tool: 'answer_question', parameters: {} };
    } catch (error) {
        console.error('[LLM] Error al seleccionar herramienta:', error);
        return { tool: 'answer_question', parameters: {} };
    }
}

// Función para ejecutar la herramienta seleccionada
async function executeToolHandler(toolName: string, parameters: any): Promise<{ statusCode: number; data: any }> {
    let statusCode = 200;
    let rawData = null;

    try {
        switch (toolName) {
            case 'process_pending_transactions': {
                const event = { body: JSON.stringify(parameters || {}) };
                const result = await processTransactionsHandler(event);
                rawData = JSON.parse(result.body);
                statusCode = result.statusCode || 200;
                break;
            }
            case 'force_close_shifts': {
                const event = { body: JSON.stringify(parameters || {}) };
                const result = await closeShiftsHandler(event);
                rawData = JSON.parse(result.body);
                statusCode = result.statusCode || 200;
                break;
            }
            case 'close_business_day': {
                const date = parameters?.date || 'today';
                const forceClosure = parameters?.forceClosure || false;
                try {
                    const apiResp = await axios.post(`${monolitoUrl}/api/business-day/close/${date}`, { forceClosure }, {
                        headers: { Authorization: `Bearer local-key-123` }
                    });
                    rawData = { tool: 'close_business_day', data: apiResp.data };
                    statusCode = apiResp.status || 200;
                } catch (err: any) {
                    if (err?.response?.status === 404) {
                        await axios.post(`${monolitoUrl}/api/admin/open-business-day/${date}`, {}, {
                            headers: { Authorization: `Bearer local-key-123` }
                        });
                        const apiResp = await axios.post(`${monolitoUrl}/api/business-day/close/${date}`, { forceClosure }, {
                            headers: { Authorization: `Bearer local-key-123` }
                        });
                        rawData = { tool: 'close_business_day', data: apiResp.data, reopenedBusinessDay: true };
                        statusCode = apiResp.status || 200;
                    } else {
                        rawData = { tool: 'close_business_day', error: true, data: err?.response?.data || { message: err.message } };
                        statusCode = err?.response?.status || 500;
                    }
                }
                break;
            }
            case 'read_local_logs': {
                const event = { body: JSON.stringify({ lines: parameters?.lines || 50 }) };
                const result = await logsHandler(event);
                rawData = JSON.parse(result.body);
                statusCode = result.statusCode || 200;
                break;
            }
            case 'get_sales_data': {
                const event = { body: JSON.stringify({ businessDay: parameters?.businessDay || 'today' }) };
                const result = await salesHandler(event);
                rawData = JSON.parse(result.body);
                statusCode = result.statusCode || 200;
                break;
            }
            case 'get_business_day_status': {
                try {
                    const date = parameters?.date || 'today';
                    const apiResp = await axios.get(`${monolitoUrl}/api/business-day/${date}`, {
                        headers: { Authorization: `Bearer local-key-123` }
                    });
                    rawData = { tool: 'get_business_day_status', data: apiResp.data };
                    statusCode = apiResp.status || 200;
                } catch (err: any) {
                    rawData = { tool: 'get_business_day_status', error: true, data: err?.response?.data || { message: err.message } };
                    statusCode = err?.response?.status || 500;
                }
                break;
            }
            case 'check_closure_status': {
                const event = { body: JSON.stringify({ businessDay: parameters?.businessDay || 'today' }) };
                const result = await closureHandler(event);
                rawData = JSON.parse(result.body);
                statusCode = result.statusCode || 200;
                break;
            }
            case 'answer_question': {
                // Para preguntas generales, obtener contexto del estado de cierre
                try {
                    const closureResp = await axios.get(`${monolitoUrl}/api/closure-status/today`, {
                        headers: { Authorization: `Bearer local-key-123` }
                    });
                    rawData = { tool: 'answer_question', context: closureResp.data };
                    statusCode = 200;
                } catch (err: any) {
                    rawData = { tool: 'answer_question', context: { error: 'No se pudo obtener contexto' } };
                    statusCode = 200; // No es error crítico para una pregunta general
                }
                break;
            }
            default:
                rawData = { tool: toolName, error: true, data: { message: 'Herramienta no soportada' } };
                statusCode = 400;
        }
    } catch (err: any) {
        rawData = { tool: toolName, error: true, data: err?.response?.data || { message: err.message } };
        statusCode = err?.response?.status || 500;
    }

    return { statusCode, data: rawData };
}

// Función para generar resumen con el LLM
async function summarizeWithLLM(params: { tool: string; data: any; userPrompt: string; model: string; originTool?: string }): Promise<string> {
    const { tool, data, userPrompt, model, originTool } = params;

    const systemPrompt = `Eres un asistente útil que resume información técnica de manera clara y concisa para usuarios no técnicos.

Instrucciones:
1. Analiza los datos proporcionados
2. Genera una respuesta natural y conversacional
3. Si hay errores, explícalos de manera clara
4. Sé breve pero informativo
5. Usa un tono amigable y profesional

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
                num_thread: DEFAULT_NUM_THREAD
            }
        });

        return response.data.response.trim();
    } catch (error) {
        console.error('[LLM] Error al generar resumen:', error);
        return 'Lo siento, no pude generar una respuesta en este momento.';
    }
}

// Handlers stub - Estos deberían implementarse según la lógica de negocio real
async function processTransactionsHandler(event: any): Promise<{ statusCode: number; body: string }> {
    // Stub: implementar lógica real de procesamiento de transacciones
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            success: true, 
            message: 'Transacciones procesadas correctamente',
            processed: 0
        })
    };
}

async function closeShiftsHandler(event: any): Promise<{ statusCode: number; body: string }> {
    // Stub: implementar lógica real de cierre de turnos
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            success: true, 
            message: 'Turnos cerrados correctamente',
            closedShifts: 0
        })
    };
}

async function logsHandler(event: any): Promise<{ statusCode: number; body: string }> {
    // Stub: implementar lógica real de lectura de logs
    const params = JSON.parse(event.body);
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            success: true, 
            logs: [],
            lines: params.lines || 50
        })
    };
}

async function salesHandler(event: any): Promise<{ statusCode: number; body: string }> {
    // Stub: implementar lógica real de obtención de datos de ventas
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            success: true, 
            sales: {
                total: 0,
                transactions: 0,
                date: 'today'
            }
        })
    };
}

async function closureHandler(event: any): Promise<{ statusCode: number; body: string }> {
    // Stub: implementar lógica real de verificación de estado de cierre
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            success: true, 
            canClose: true,
            pendingItems: []
        })
    };
}

// MCP endpoint - Nuevo flujo basado en IA
app.post('/mcp', async (req, res) => {
    try {
        console.log('HEADERS:', req.headers);
        console.log('BODY:', req.body);

        const { payload } = req.body;
        const model = payload?.model || DEFAULT_LLM_MODEL;
        const userPrompt = payload?.userPrompt || payload?.prompt || '';

        // Validar que haya un prompt del usuario
        if (!userPrompt) {
            return res.status(400).json({ error: 'Missing userPrompt in payload' });
        }

        console.log(`[MCP] Procesando prompt del usuario: "${userPrompt}"`);

        // 1. El LLM selecciona la herramienta apropiada basándose en el prompt
        const selectedTool = await selectToolWithLLM(userPrompt, model);
        console.log(`[MCP] Herramienta seleccionada por IA: ${selectedTool.tool}`, selectedTool.parameters);

        // 2. Ejecutar la herramienta seleccionada
        const { statusCode, data: rawData } = await executeToolHandler(selectedTool.tool, selectedTool.parameters);
        console.log(`[MCP] Herramienta ejecutada con código: ${statusCode}`);

        // 3. Generar resumen con el LLM
        const summaryText = await summarizeWithLLM({ 
            tool: selectedTool.tool, 
            data: rawData, 
            userPrompt, 
            model,
            originTool: selectedTool.tool 
        });

        // 4. Retornar respuesta
        return res.status(statusCode).json({
            tool: selectedTool.tool,
            parameters: selectedTool.parameters,
            data: rawData,
            summaryText
        });
    } catch (err: any) {
        console.error('[MCP] Error en endpoint:', err);
        res.status(500).json({ error: err.message || 'Error interno del servidor' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`MCP server running on port ${PORT}`);
    // Precalentar el modelo con reintentos y auto-pull para evitar latencia y 404 en primer arranque
    setTimeout(() => { warmUpLLM().catch(() => { }); }, 1000);
});
