import * as fs from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@langchain/core/tools";
import type { MCPClientWithTools, IGetTools, MCPConfig, LoadedTool } from "../../types/index.js";
import { CONFIG_FILE_PATH } from "../../config/environment.js";

export async function createClientAndGetTools(
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

export async function loadServers(): Promise<IGetTools> {
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

export async function executeToolHandler(
    clients: MCPClientWithTools[],
    toolName: string,
    parameters: any
): Promise<{ statusCode: number; data: any }> {
    console.log(`[MCP] Ejecutando tool: ${toolName}`, parameters);

    try {
        let targetClient = null;
        for (const clientWithTools of clients) {
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
