import { createApp } from "./src/app.js";
import { createOllamaInstance } from "./src/services/llm/ollamaService.js";
import { warmUpLLM } from "./src/services/llm/warmup.js";
import { loadServers } from "./src/services/mcp/mcpClient.js";
import { initializeRAG } from "./src/services/rag/ragService.js";
import { PORT } from "./src/config/environment.js";
import type { GlobalState } from "./src/types/index.js";

const state: GlobalState = {
    clients: [],
    modelWithTools: null,
    tools: [],
    vectorStore: null,
    ragChain: null,
    llm: null,
};

async function initialize() {
    try {
        // 1. Crear instancia única de ChatOllama
        state.llm = createOllamaInstance();

        // 2. Cargar MCP servers y tools
        const { clients, allTools } = await loadServers();
        state.clients = clients;
        state.tools = allTools;
        console.log(`[INIT] ${allTools.length} tools MCP cargadas`);

        // 3. Inicializar RAG usando la instancia global
        const { vectorStore, ragChain } = await initializeRAG(state.llm);
        state.vectorStore = vectorStore;
        state.ragChain = ragChain;
        console.log("[INIT] Sistema RAG inicializado");

        // 4. Precalentar el modelo
        await warmUpLLM(state.llm, allTools);
        state.modelWithTools = state.llm.bindTools(allTools);

        console.log("\n✅ [INIT] Sistema híbrido RAG + MCP listo\n");
        console.log(`   📚 RAG: Consultas institucionales`);
        console.log(`   🔧 MCP: ${allTools.length} tools para consultas personales`);
        console.log(`   🤖 LLM: Instancia única compartida\n`);

        return state;
    } catch (error) {
        console.error("[INIT] Error en inicialización:", error);
        throw error;
    }
}

// Create Express app
const app = createApp(state);

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor híbrido RAG + MCP corriendo en puerto ${PORT}`);
    setTimeout(() => {
        initialize().catch((err) => {
            console.error("Error fatal en inicialización:", err);
            process.exit(1);
        });
    }, 1000);
});
