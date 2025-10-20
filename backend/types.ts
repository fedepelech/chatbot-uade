import { Tool } from '@langchain/core/tools';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

export interface WarmLLMOptions {
    num_predict: number;
    num_thread?: number;
}

export interface LoadedTool {
  name: string,
  description: string,
  inputSchema: {
    type: string,
    properties: Record<string, object>,
    required: string[],
    additionalProperties: boolean,
    $schema: string,
  },
  outputSchema?: {
    type: string,
    properties: Record<string, object>;
  }
}

export interface MCPConfig {
  mcpServers: {
    [key: string]: {
      command: string;
      args: string[];
    };
  };
}

export interface MCPClientWithTools {
  client: Client;
  tools: LoadedTool[];
}

export interface IGetTools {
  clients: MCPClientWithTools[];
  allTools: Tool[];
}
