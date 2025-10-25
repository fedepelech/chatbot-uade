import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { loadUADEKnowledge } from "./knowledgeLoader.js";
import { RAG_PROMPT_TEMPLATE, formatDocs } from "./prompts.js";
import { ollamaUrl, chromaUrl, KNOWLEDGE_BASE_FILE_PATH } from "../../config/environment.js";
import type { RAGInitResult } from "../../types/index.js";

export async function initializeRAG(llm: ChatOllama): Promise<RAGInitResult> {
    try {
        console.log("🔧 [RAG] Inicializando sistema RAG...");
        
        // 1. Cargar base de conocimiento
        const documents = await loadUADEKnowledge(KNOWLEDGE_BASE_FILE_PATH);
        
        // 2. Configurar embeddings
        const embeddings = new OllamaEmbeddings({
            baseUrl: ollamaUrl,
            model: "nomic-embed-text"
        });
        
        // 3. Crear vector store
        console.log("🔢 [RAG] Generando embeddings...");
        console.log(`[RAG] Conectando a ChromaDB en: ${chromaUrl}`);
        const vectorStore = await Chroma.fromDocuments(
            documents,
            embeddings,
            {
                collectionName: "uade_knowledge_base",
                url: chromaUrl
            }
        );
        
        // 4. Crear retriever
        const retriever = vectorStore.asRetriever({
            k: 3,
            searchType: "similarity"
        });
        
        // 5. Crear RAG chain usando la instancia global de LLM
        const ragChain = RunnableSequence.from([
            {
                context: async (input: any) => {
                    const docs = await retriever._getRelevantDocuments(input.question);
                    return formatDocs(docs);
                },
                question: (input: any) => input.question
            },
            RAG_PROMPT_TEMPLATE,
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

export async function executeRAGQuery(ragChain: any, userPrompt: string): Promise<string> {
    if (!ragChain) {
        return "Lo siento, el sistema de información institucional no está disponible en este momento.";
    }
    
    try {
        console.log("[RAG] Ejecutando consulta institucional:", userPrompt);
        const response = await ragChain.invoke({ question: userPrompt });
        console.log("[RAG] Respuesta generada exitosamente");
        return response;
    } catch (error) {
        console.error("[RAG] Error al ejecutar consulta:", error);
        return "Lo siento, ocurrió un error al procesar tu consulta institucional.";
    }
}
