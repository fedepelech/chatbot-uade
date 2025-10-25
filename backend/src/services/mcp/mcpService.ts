import type { MCPClientWithTools } from "../../types/index.js";
import { selectToolWithLLM, summarizeWithLLM } from "./toolSelector.js";
import { executeToolHandler } from "./mcpClient.js";
import { Tool } from "@langchain/core/tools";

export async function executeMCPQuery(
    clients: MCPClientWithTools[],
    tools: Tool[],
    userPrompt: string,
    legajo: string,
    model: string
): Promise<{ statusCode: number; data: any; summaryText: string; tool: string; parameters: any }> {
    console.log("[HYBRID] Usando MCP Tools");
    
    if (!legajo) {
        throw new Error("Se requiere legajo para consultas personales");
    }
    
    const selectedTool = await selectToolWithLLM(userPrompt, model, legajo, tools);
    console.log(`[HYBRID] Tool seleccionada: ${selectedTool.tool}`);
    
    const { statusCode, data: rawData } = await executeToolHandler(
        clients,
        selectedTool.tool,
        selectedTool.parameters
    );
    
    const summaryText = await summarizeWithLLM({
        tool: selectedTool.tool,
        data: rawData,
        userPrompt,
        model,
    });
    
    return {
        statusCode,
        data: rawData,
        summaryText,
        tool: selectedTool.tool,
        parameters: selectedTool.parameters
    };
}
