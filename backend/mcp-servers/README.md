# MCP Servers - Student Data

## Descripción

Este directorio contiene los servidores MCP (Model Context Protocol) que exponen los datos de los estudiantes al chatbot.

## Servidor: student-data-server

### Propósito

El servidor `student-data-server.ts` expone los datos de cada estudiante divididos en 9 tools separadas, una por cada sección del JSON del estudiante.

### Tools Disponibles

| Tool | Descripción | Datos que retorna |
|------|-------------|-------------------|
| `get_datos_personales` | Datos personales del estudiante | Nombre, documento, contacto, dirección, emergencia |
| `get_datos_carrera` | Información de la carrera | Carrera, plan de estudios, estado académico |
| `get_historial_academico` | Historial académico completo | Materias aprobadas, notas, créditos |
| `get_cursada_actual` | Materias del cuatrimestre actual | Materias cursando, horarios, docentes |
| `get_examenes_pendientes` | Exámenes finales pendientes | Materias para rendir, fechas disponibles |
| `get_cuenta_corriente` | Estado de cuenta | Cuotas, pagos, deudas, vencimientos |
| `get_becas` | Información de becas | Becas activas, historial, solicitudes |
| `get_titulos` | Títulos y progreso | Progreso de carrera, títulos obtenidos |
| `get_datos_sistema` | Datos del sistema | Accesos, servicios, notificaciones |

### Parámetros

Todas las tools requieren un único parámetro:

- `legajo` (string): Número de legajo del estudiante

### Ejemplo de uso

```typescript
// El LLM selecciona la tool apropiada según la pregunta
// Pregunta: "¿Cuál es mi email institucional?"
// Tool seleccionada: get_datos_personales

await client.callTool({
  name: 'get_datos_personales',
  arguments: {
    legajo: '123456'
  }
});

// Respuesta:
{
  "identificacion": {
    "nombre": "María",
    "apellido": "González",
    ...
  },
  "contacto": {
    "email_institucional": "mgonzalez@mail.uade.edu.ar",
    ...
  },
  ...
}
```

### Estructura de archivos

```
backend/
├── data/
│   ├── 123456.json    # Datos del estudiante con legajo 123456
│   ├── 789012.json    # Datos del estudiante con legajo 789012
│   └── ...
├── mcp-servers/
│   ├── student-data-server.ts
│   └── README.md
└── config/
    └── config.json    # Configuración MCP
```

### Flujo de ejecución

1. **Usuario pregunta**: "¿Cuánto debo de la cuota?"
2. **LLM selecciona tool**: `get_cuenta_corriente` con `legajo: "123456"`
3. **Servidor MCP**: Lee `/data/123456.json`
4. **Servidor MCP**: Extrae la sección `cuenta_corriente`
5. **Servidor MCP**: Retorna el JSON de esa sección
6. **LLM interpreta**: Genera respuesta natural: "Tenés una deuda de $45,000 de la cuota de septiembre..."

### Ventajas de este diseño

✅ **Modular**: Cada sección es una tool independiente  
✅ **Eficiente**: Solo se carga la información necesaria  
✅ **Escalable**: Fácil agregar nuevas secciones  
✅ **Seguro**: El legajo se valida en cada llamada  
✅ **Inteligente**: El LLM decide qué tool usar según la pregunta  

### Instalación

```bash
# Instalar dependencias
npm install ts-node @types/node

# El servidor se ejecuta automáticamente cuando el backend inicia
npm start
```

### Configuración

El servidor se registra en `config/config.json`:

```json
{
  "mcpServers": {
    "student-data": {
      "command": "node",
      "args": [
        "--loader",
        "ts-node/esm",
        "mcp-servers/student-data-server.ts"
      ]
    }
  }
}
```

### Logs

El servidor emite logs a stderr para no interferir con el protocolo MCP:

```
Student Data MCP Server running on stdio
```

### Manejo de errores

Si el legajo no existe:
```json
{
  "error": true,
  "message": "No se encontró información para el legajo: 999999"
}
```

Si falta el parámetro legajo:
```json
{
  "error": true,
  "message": "El parámetro \"legajo\" es requerido"
}
```

### Testing

Para probar el servidor manualmente:

```bash
# Desde el directorio backend
node --loader ts-node/esm mcp-servers/student-data-server.ts
```

Luego enviar un request MCP:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

### Próximos pasos

- [ ] Agregar caché para mejorar performance
- [ ] Implementar validación de permisos por legajo
- [ ] Agregar logs más detallados
- [ ] Crear tests unitarios
