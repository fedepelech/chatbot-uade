#!/usr/bin/env node

/**
 * MCP Server - Student Data
 * 
 * Servidor MCP que expone los datos del estudiante divididos por secciones.
 * Cada sección del JSON del estudiante se expone como una tool separada.
 * 
 * El servidor lee el archivo JSON basándose en el legajo del estudiante
 * que se pasa como argumento en cada llamada a las tools.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// Directorio donde se encuentran los archivos JSON de estudiantes
const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Lee el archivo JSON del estudiante basándose en su legajo
 */
async function loadStudentData(legajo: string): Promise<any> {
  try {
    const filePath = path.join(DATA_DIR, `${legajo}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`No se encontró información para el legajo: ${legajo}`);
    }
    throw new Error(`Error al leer datos del estudiante: ${error.message}`);
  }
}

/**
 * Definición de las tools disponibles
 * Cada tool corresponde a una sección del JSON del estudiante
 */
const TOOLS = [
  {
    name: 'get_datos_personales',
    description: 'Obtiene los datos personales del estudiante (nombre, documento, contacto, dirección, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        legajo: {
          type: 'string',
          description: 'Número de legajo del estudiante',
        },
      },
      required: ['legajo'],
    },
  },
  {
    name: 'get_datos_carrera',
    description: 'Obtiene información sobre la carrera del estudiante (carrera, plan de estudios, estado académico, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        legajo: {
          type: 'string',
          description: 'Número de legajo del estudiante',
        },
      },
      required: ['legajo'],
    },
  },
  {
    name: 'get_historial_academico',
    description: 'Obtiene el historial académico completo del estudiante (materias aprobadas, notas, créditos, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        legajo: {
          type: 'string',
          description: 'Número de legajo del estudiante',
        },
      },
      required: ['legajo'],
    },
  },
  {
    name: 'get_cursada_actual',
    description: 'Obtiene las materias que el estudiante está cursando actualmente en el cuatrimestre',
    inputSchema: {
      type: 'object',
      properties: {
        legajo: {
          type: 'string',
          description: 'Número de legajo del estudiante',
        },
      },
      required: ['legajo'],
    },
  },
  {
    name: 'get_examenes_pendientes',
    description: 'Obtiene los exámenes finales pendientes del estudiante',
    inputSchema: {
      type: 'object',
      properties: {
        legajo: {
          type: 'string',
          description: 'Número de legajo del estudiante',
        },
      },
      required: ['legajo'],
    },
  },
  {
    name: 'get_cuenta_corriente',
    description: 'Obtiene el estado de cuenta corriente del estudiante (cuotas, pagos, deudas, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        legajo: {
          type: 'string',
          description: 'Número de legajo del estudiante',
        },
      },
      required: ['legajo'],
    },
  },
  {
    name: 'get_becas',
    description: 'Obtiene información sobre becas del estudiante (activas, historial, solicitudes)',
    inputSchema: {
      type: 'object',
      properties: {
        legajo: {
          type: 'string',
          description: 'Número de legajo del estudiante',
        },
      },
      required: ['legajo'],
    },
  },
  {
    name: 'get_titulos',
    description: 'Obtiene información sobre títulos y progreso académico del estudiante',
    inputSchema: {
      type: 'object',
      properties: {
        legajo: {
          type: 'string',
          description: 'Número de legajo del estudiante',
        },
      },
      required: ['legajo'],
    },
  },
  {
    name: 'get_datos_sistema',
    description: 'Obtiene información del sistema (accesos, servicios habilitados, configuración de notificaciones)',
    inputSchema: {
      type: 'object',
      properties: {
        legajo: {
          type: 'string',
          description: 'Número de legajo del estudiante',
        },
      },
      required: ['legajo'],
    },
  },
];

/**
 * Handlers para cada tool
 */
const toolHandlers: Record<string, (legajo: string) => Promise<any>> = {
  get_datos_personales: async (legajo: string) => {
    const data = await loadStudentData(legajo);
    return data.datos_personales;
  },
  get_datos_carrera: async (legajo: string) => {
    const data = await loadStudentData(legajo);
    return data.datos_carrera;
  },
  get_historial_academico: async (legajo: string) => {
    const data = await loadStudentData(legajo);
    return data.historial_academico;
  },
  get_cursada_actual: async (legajo: string) => {
    const data = await loadStudentData(legajo);
    return data.cursada_actual;
  },
  get_examenes_pendientes: async (legajo: string) => {
    const data = await loadStudentData(legajo);
    return data.examenes_pendientes;
  },
  get_cuenta_corriente: async (legajo: string) => {
    const data = await loadStudentData(legajo);
    return data.cuenta_corriente;
  },
  get_becas: async (legajo: string) => {
    const data = await loadStudentData(legajo);
    return data.becas;
  },
  get_titulos: async (legajo: string) => {
    const data = await loadStudentData(legajo);
    return data.titulos;
  },
  get_datos_sistema: async (legajo: string) => {
    const data = await loadStudentData(legajo);
    return data.datos_sistema;
  },
};

/**
 * Crear e inicializar el servidor MCP
 */
async function main() {
  const server = new Server(
    {
      name: 'student-data-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handler para listar las tools disponibles
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS,
    };
  });

  // Handler para ejecutar las tools
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!args || typeof args !== 'object') {
      throw new Error('Argumentos inválidos');
    }

    const { legajo } = args as { legajo?: string };

    if (!legajo) {
      throw new Error('El parámetro "legajo" es requerido');
    }

    // Buscar el handler correspondiente
    const handler = toolHandlers[name];

    if (!handler) {
      throw new Error(`Tool no encontrada: ${name}`);
    }

    try {
      // Ejecutar el handler
      const result = await handler(legajo);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              message: error.message,
            }),
          },
        ],
        isError: true,
      };
    }
  });

  // Conectar el servidor usando stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Student Data MCP Server running on stdio');
}

// Ejecutar el servidor con top-level await
try {
  await main();
} catch (error) {
  console.error('Fatal error in main():', error);
  process.exit(1);
}
