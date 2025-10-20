# Ejemplo de Flujo Completo con Student Data Server

## Escenario: Usuario pregunta sobre su deuda

### 1. Request del Frontend al Backend

```http
POST http://localhost:4000/mcp
Content-Type: application/json

{
  "payload": {
    "userPrompt": "¿Cuánto debo de la cuota?",
    "legajo": "123456"
  }
}
```

---

### 2. Backend: Selección de Tool con LLM

El backend llama a `selectToolWithLLM()`:

**Prompt enviado al LLM:**
```
Eres un asistente que selecciona la herramienta más apropiada.

Herramientas disponibles:
- get_datos_personales: Obtiene los datos personales del estudiante
- get_datos_carrera: Obtiene información sobre la carrera del estudiante
- get_historial_academico: Obtiene el historial académico completo
- get_cursada_actual: Obtiene las materias que está cursando actualmente
- get_examenes_pendientes: Obtiene los exámenes finales pendientes
- get_cuenta_corriente: Obtiene el estado de cuenta corriente (cuotas, pagos, deudas)
- get_becas: Obtiene información sobre becas del estudiante
- get_titulos: Obtiene información sobre títulos y progreso académico
- get_datos_sistema: Obtiene información del sistema

Usuario: "¿Cuánto debo de la cuota?"
```

**Respuesta del LLM:**
```json
{
  "tool": "get_cuenta_corriente",
  "parameters": {
    "legajo": "123456"
  }
}
```

---

### 3. Backend: Ejecución de Tool via MCP

El backend llama a `executeToolHandler("get_cuenta_corriente", {legajo: "123456"})`:

1. Busca la tool en `globalTools` ✓
2. Encuentra el cliente MCP "student-data" ✓
3. Invoca: `client.callTool({name: "get_cuenta_corriente", arguments: {legajo: "123456"}})`

---

### 4. MCP Server: Procesamiento

El servidor `student-data-server.ts`:

1. Recibe la llamada a `get_cuenta_corriente`
2. Lee el archivo `/backend/data/123456.json`
3. Extrae la sección `cuenta_corriente`
4. Retorna el JSON:

```json
{
  "resumen": {
    "saldo_total": -45000,
    "cuotas_pendientes": 1,
    "cuotas_vencidas": 1,
    "proximo_vencimiento": "2024-10-10",
    "monto_proximo_vencimiento": 45000
  },
  "cuotas": [
    {
      "numero_cuota": 7,
      "periodo": "2024-09",
      "fecha_vencimiento": "2024-09-10",
      "monto_original": 45000,
      "monto_pagado": 0,
      "saldo": 45000,
      "estado": "Vencida",
      "dias_mora": 37,
      "recargo_mora": 4500
    },
    {
      "numero_cuota": 8,
      "periodo": "2024-10",
      "fecha_vencimiento": "2024-10-10",
      "monto_original": 45000,
      "monto_pagado": 0,
      "saldo": 45000,
      "estado": "Pendiente"
    }
  ],
  "metodos_pago_disponibles": [
    "Transferencia bancaria",
    "Tarjeta de crédito",
    "Tarjeta de débito",
    "Pago Fácil",
    "RapiPago",
    "MercadoPago"
  ]
}
```

---

### 5. Backend: Generación de Resumen con LLM

El backend llama a `summarizeWithLLM()`:

**Prompt enviado al LLM:**
```
Eres un asistente útil que resume información técnica de manera clara.

Datos del sistema:
{
  "tool": "get_cuenta_corriente",
  "result": {
    "resumen": {
      "saldo_total": -45000,
      "cuotas_pendientes": 1,
      "cuotas_vencidas": 1,
      ...
    },
    ...
  }
}

Pregunta del usuario: "¿Cuánto debo de la cuota?"

Respuesta:
```

**Respuesta del LLM:**
```
Hola María! 👋

Tenés una deuda pendiente de $45.000 correspondiente a la cuota de septiembre (cuota 7), 
que venció el 10/09/2024. Como está vencida, tiene un recargo por mora de $4.500.

También tenés pendiente la cuota de octubre (cuota 8) por $45.000, que vence el 10/10/2024.

Total a pagar: $94.500 (incluyendo el recargo por mora)

Podés pagar mediante:
• Transferencia bancaria
• Tarjeta de crédito/débito
• Pago Fácil o RapiPago
• MercadoPago

¿Necesitás ayuda con algo más relacionado a tu cuenta?
```

---

### 6. Response al Frontend

```json
{
  "tool": "get_cuenta_corriente",
  "parameters": {
    "legajo": "123456"
  },
  "data": {
    "tool": "get_cuenta_corriente",
    "result": {
      "resumen": {
        "saldo_total": -45000,
        ...
      },
      ...
    },
    "isError": false
  },
  "summaryText": "Hola María! 👋\n\nTenés una deuda pendiente de $45.000..."
}
```

---

## Otros Ejemplos de Preguntas

### Ejemplo 2: "¿Cuál es mi email institucional?"

**Tool seleccionada:** `get_datos_personales`

**Datos retornados:**
```json
{
  "contacto": {
    "email_institucional": "mgonzalez@mail.uade.edu.ar",
    ...
  }
}
```

**Respuesta del LLM:**
```
Tu email institucional es: mgonzalez@mail.uade.edu.ar
```

---

### Ejemplo 3: "¿Qué materias estoy cursando?"

**Tool seleccionada:** `get_cursada_actual`

**Datos retornados:**
```json
{
  "cuatrimestre": "2024-2",
  "materias": [
    {
      "nombre": "Análisis Matemático I",
      "codigo": "MAT-101",
      ...
    },
    ...
  ]
}
```

**Respuesta del LLM:**
```
Este cuatrimestre (2024-2) estás cursando 4 materias:

1. Análisis Matemático I (MAT-101)
2. Álgebra y Geometría Analítica (MAT-102)
3. Introducción a la Programación (INF-101)
4. Fundamentos de Administración (ADM-101)

¿Querés saber los horarios o más detalles de alguna?
```

---

### Ejemplo 4: "¿Tengo exámenes pendientes?"

**Tool seleccionada:** `get_examenes_pendientes`

**Datos retornados:**
```json
{
  "cantidad_total": 0,
  "materias": []
}
```

**Respuesta del LLM:**
```
¡Buenas noticias! No tenés exámenes finales pendientes por el momento. 
Todas tus materias están al día. 😊
```

---

## Ventajas de este Diseño

### ✅ Eficiencia
- Solo se carga la información necesaria
- No se envía todo el JSON al LLM
- Respuestas más rápidas

### ✅ Modularidad
- Cada sección es independiente
- Fácil agregar nuevas secciones
- Fácil modificar el schema de cada sección

### ✅ Seguridad
- El legajo se valida en cada llamada
- Los datos se leen desde archivos locales
- No hay acceso directo a la base de datos desde el frontend

### ✅ Inteligencia
- El LLM decide automáticamente qué tool usar
- No hay reglas hardcodeadas
- Se adapta a preguntas en lenguaje natural

### ✅ Escalabilidad
- Agregar nuevos estudiantes = agregar archivo JSON
- Agregar nuevas secciones = agregar tool al servidor
- No requiere modificar el backend principal

---

## Flujo Visual

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND                                                        │
│ Usuario: "¿Cuánto debo de la cuota?"                           │
│ Legajo: 123456 (desde localStorage)                            │
└────────────────────┬────────────────────────────────────────────┘
                     │ POST /mcp
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND - selectToolWithLLM()                                   │
│ LLM analiza 9 tools disponibles                                 │
│ Decide: "get_cuenta_corriente" es la apropiada                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND - executeToolHandler()                                  │
│ Busca cliente MCP "student-data"                                │
│ Invoca: client.callTool({                                       │
│   name: "get_cuenta_corriente",                                 │
│   arguments: {legajo: "123456"}                                 │
│ })                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ MCP SERVER - student-data-server.ts                            │
│ 1. Lee: /data/123456.json                                       │
│ 2. Extrae: data.cuenta_corriente                                │
│ 3. Retorna: JSON con cuotas, saldo, vencimientos               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND - summarizeWithLLM()                                    │
│ LLM recibe datos crudos de cuenta corriente                     │
│ Genera respuesta natural y amigable                             │
│ "Hola María! Tenés una deuda de $45.000..."                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND                                                        │
│ Muestra: summaryText en el chat                                 │
│ Usuario ve respuesta conversacional                             │
└─────────────────────────────────────────────────────────────────┘
```
