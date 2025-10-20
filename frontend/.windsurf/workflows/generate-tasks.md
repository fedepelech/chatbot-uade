---
description: Generación de una Lista de Tareas a partir de un PRD
auto_execution_mode: 1
---

# Workflow: Generación de una Lista de Tareas a partir de un PRD

## Objetivo

Guiar a un asistente de IA para crear una lista de tareas detallada y paso a paso en formato Markdown basada en un Documento de Requisitos del Producto (PRD) existente. La lista de tareas debe guiar a un desarrollador durante la implementación.

## Trigger

- **Tipo:** `workflow_call`  
- **Parámetro:**  
  - `PROJECT_PATH` (string): Nombre de la carpeta raiz del proyecto
  - `PRD-FILE-NAME` (string): Nombre del archivo de requisitos con extension incluida

## Proceso

1.  **Recibir Referencia del PRD:** El usuario indica a la IA un archivo PRD específico que esta alojado en la carpeta `$PROJECT_PATH/.docs/`
2.  **Analizar el PRD:** La IA lee y analiza los requisitos funcionales, historias de usuario y otras secciones del PRD especificado.
3.  **Fase 1: Generar Tareas Principales:** Basándose en el análisis del PRD, crear el archivo y generar las tareas principales de alto nivel necesarias para implementar la funcionalidad. Usa tu criterio para decidir cuántas tareas principales incluir (probablemente alrededor de 5). Presenta estas tareas al usuario en el formato especificado (sin subtareas aún). Informa al usuario: "He generado las tareas principales basadas en el PRD. ¿Listo para generar las subtareas? Responde con 'Si' para continuar."
4.  **Esperar Confirmación:** Pausa y espera a que el usuario responda con "Si".
5.  **Fase 2: Generar Subtareas:** Una vez que el usuario confirme, desglosa cada tarea principal en subtareas más pequeñas y accionables necesarias para completar la tarea principal. Asegúrate de que las subtareas sigan lógicamente de la tarea principal y cubran los detalles de implementación implícitos en el PRD.
6.  **Identificar Archivos Relevantes:** Basándote en las tareas y el PRD, identifica los archivos potenciales que necesitarán ser creados o modificados. Lista estos archivos en la sección `Archivos Relevantes`, incluyendo los archivos de prueba correspondientes si aplica.
7.  **Generar Salida Final:** Combina las tareas principales, subtareas, archivos relevantes y notas en la estructura final de Markdown.
8.  **Guardar la Lista de Tareas:** Guarda el documento generado en el mismo directorio donde se encuentra el archivo PRD de entrada, con el nombre `[prd-file-name]-tasks.md`, donde `[prd-file-name]` coincide con el nombre base del archivo PRD de entrada `$PRD-FILE-NAME` (ejemplo: si el archivo de entrada fue `frontend-prd-user-profile-editing.md`, la salida será `frontend-prd-user-profile-editing-tasks.md`).

## Formato de Salida

La lista de tareas generada _debe_ seguir esta estructura:

```markdown
## Archivos Relevantes

- `path/to/potential/file1.ts` - Breve descripción de por qué este archivo es relevante (ejemplo: Contiene el componente principal para esta funcionalidad).
- `path/to/file1.test.ts` - Pruebas unitarias para `file1.ts`.
- `path/to/another/file.tsx` - Breve descripción (ejemplo: Manejador de ruta API para el envío de datos).
- `path/to/another/file.test.tsx` - Pruebas unitarias para `another/file.tsx`.
- `lib/utils/helpers.ts` - Breve descripción (ejemplo: Funciones de utilidad necesarias para cálculos).
- `lib/utils/helpers.test.ts` - Pruebas unitarias para `helpers.ts`.

### Notas

- Las pruebas unitarias generalmente deben ubicarse junto a los archivos de código que prueban (ejemplo: `MyComponent.tsx` y `MyComponent.test.tsx` en el mismo directorio).
- Usa `npx jest [optional/path/to/test/file]` para ejecutar pruebas. Ejecutar sin una ruta ejecuta todas las pruebas encontradas por la configuración de Jest.

## Tareas

- [ ] 1.0 Título de la Tarea Principal
  - [ ] 1.1 [Descripción de la subtarea 1.1]
  - [ ] 1.2 [Descripción de la subtarea 1.2]
- [ ] 2.0 Título de la Tarea Principal
  - [ ] 2.1 [Descripción de la subtarea 2.1]
- [ ] 3.0 Título de la Tarea Principal (puede no requerir subtareas si es puramente estructural o de configuración)

## Interaction Model

El proceso requiere explícitamente una pausa después de generar las tareas principales para obtener la confirmación del usuario ("GO") antes de proceder a generar las subtareas detalladas. Esto garantiza que el plan de alto nivel esté alineado con las expectativas del usuario antes de profundizar en los detalles.

## Target Audience

Asume que el principal destinatario de la lista de tareas es un **desarrollador junior** que implementará la funcionalidad.

## Salida

- **Formato:** Markdown (`.md`)
- **Ubicación:** se debe ubicar en la carpeta `$PROJECT_PATH/.tasks/`
- **Nombre del archivo:** `[prd-file-name]-tasks.md` (ejemplo, `prd-user-profile-editing-tasks.md`)