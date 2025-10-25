import { Tool } from "@langchain/core/tools";
import { ChatOllama } from "@langchain/ollama";
import type { MCPClientWithTools } from "../../types.js";

export {
    IGetTools,
    LoadedTool,
    MCPClientWithTools,
    MCPConfig,
    WarmLLMOptions,
} from "../../types.js";

export type QueryIntent = {
    type: 'rag' | 'mcp';
    confidence: number;
    reasoning: string;
};

export interface GlobalState {
    clients: MCPClientWithTools[];
    modelWithTools: ReturnType<ChatOllama["bindTools"]> | null;
    tools: Tool[];
    vectorStore: any;
    ragChain: any;
    llm: ChatOllama | null;
}

export interface ToolSelection {
    tool: string;
    parameters: any;
}

export interface RAGInitResult {
    vectorStore: any;
    ragChain: any;
}
