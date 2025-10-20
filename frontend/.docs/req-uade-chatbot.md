# Requisitos Detallados - UadeBot (Chatbot Académico)

## 1. Introducción/Resumen

### Contexto
Desarrollo de una aplicación web de página única (SPA) en React.js con TypeScript que implementa un chatbot académico denominado "UadeBot". El chatbot servirá como asistente virtual para estudiantes de UADE, proporcionando respuestas a consultas específicas de usuarios y consultas administrativas generales de la facultad.

### Propósito
Crear un frontend simple y funcional que permita la interacción básica con un chatbot, con diseño institucional de UADE, preparado para futura integración con una API backend que utiliza Model Context Protocol (MCP) para proporcionar contexto a un LLM.

### Alcance
- Interfaz centrada con componente de chatbot
- Diseño visual alineado con identidad institucional UADE
- Service mockeado preparado para integración con API REST/WebSocket
- Enfoque en simplicidad y mínimas dependencias

---

## 2. Requisitos Funcionales

### RQ-001: Visualización Centrada del Chatbot
**Prioridad:** Alta

El sistema debe renderizar un único componente de chatbot centrado vertical y horizontalmente en la pantalla cuando el usuario accede a la aplicación.

**Criterios de Aceptación:**
- [ ] El chatbot se muestra en el centro de la ventana del navegador
- [ ] El chatbot mantiene su posición centrada en diferentes resoluciones de escritorio (mínimo 1024x768)
- [ ] El fondo de la página es de color oscuro para contrastar con el chatbot

---

### RQ-002: Header del Chatbot con Identidad Visual
**Prioridad:** Alta

El sistema debe mostrar un header en el chatbot que incluya un avatar de robot y el título "UadeBot" utilizando la paleta de colores institucional de UADE.

**Criterios de Aceptación:**
- [ ] Se muestra un icono/avatar de robot
- [ ] El título "UadeBot" es claramente visible
- [ ] Se aplican los colores institucionales UADE (#00405c - azul petróleo principal, #ffffff - blanco)
- [ ] El header tiene un diseño limpio y profesional

---

### RQ-003: Área de Visualización de Mensajes
**Prioridad:** Alta

El sistema debe proporcionar un área scrollable donde se visualicen los mensajes del chat entre el usuario y el bot, distinguiendo claramente los mensajes de cada participante.

**Criterios de Aceptación:**
- [ ] Los mensajes del usuario se muestran alineados a la derecha
- [ ] Los mensajes del bot se muestran alineados a la izquierda con el avatar
- [ ] Cada mensaje tiene un estilo visual diferenciado (usuario vs bot)
- [ ] El área de mensajes es scrollable cuando el contenido excede el alto disponible
- [ ] Se aplican colores institucionales UADE en los elementos del chat

---

### RQ-004: Input Multilinea para Mensajes
**Prioridad:** Alta

El sistema debe proveer un campo de texto multilinea (textarea) donde el usuario pueda escribir sus consultas antes de enviarlas.

**Criterios de Aceptación:**
- [ ] El input soporta múltiples líneas de texto
- [ ] El input tiene placeholder descriptivo (ej: "Escribe tu consulta...")
- [ ] El input se expande verticalmente hasta un límite razonable
- [ ] El input tiene estilos coherentes con la paleta UADE

---

### RQ-005: Botón de Envío de Mensajes
**Prioridad:** Alta

El sistema debe incluir un botón claramente identificable que permita enviar el mensaje escrito en el input al chatbot.

**Criterios de Aceptación:**
- [ ] El botón tiene label "Enviar" o icono representativo
- [ ] El botón está posicionado junto al input (generalmente a la derecha)
- [ ] El botón responde al click del usuario
- [ ] El botón utiliza colores institucionales UADE para hover/active states

---

### RQ-006: Validación de Mensajes Vacíos
**Prioridad:** Alta

El sistema debe prevenir el envío de mensajes vacíos o que contengan únicamente espacios en blanco.

**Criterios de Aceptación:**
- [ ] El botón de envío se deshabilita cuando el input está vacío
- [ ] El botón de envío se deshabilita cuando el input contiene solo espacios/saltos de línea
- [ ] Se muestra feedback visual cuando el botón está deshabilitado (ej: opacidad reducida)
- [ ] No se ejecuta acción alguna al intentar enviar mensaje vacío

---

### RQ-007: Envío de Mensaje por Enter
**Prioridad:** Media

El sistema debe permitir enviar mensajes presionando la tecla Enter, mientras que Shift+Enter debe crear una nueva línea.

**Criterios de Aceptación:**
- [ ] Al presionar Enter (sin Shift), se envía el mensaje
- [ ] Al presionar Shift+Enter, se inserta un salto de línea
- [ ] El comportamiento es consistente en toda la sesión
- [ ] El input se limpia después de enviar el mensaje

---

### RQ-008: Respuesta Hardcodeada del Bot
**Prioridad:** Alta

El sistema debe responder a cualquier mensaje del usuario con una respuesta predefinida hardcodeada para permitir pruebas del frontend sin dependencia del backend.

**Criterios de Aceptación:**
- [ ] Cada mensaje del usuario genera una respuesta del bot
- [ ] La respuesta es una cadena de texto predefinida en el código
- [ ] La respuesta aparece después del mensaje del usuario
- [ ] Se utiliza un service mockeado para simular la llamada a la API

---

### RQ-009: Indicador Visual de "Escribiendo..."
**Prioridad:** Alta

El sistema debe mostrar un indicador visual (typing indicator) que simule que el bot está procesando y escribiendo una respuesta.

**Criterios de Aceptación:**
- [ ] Aparece un indicador "escribiendo..." después de enviar un mensaje
- [ ] El indicador se muestra durante un breve período (1-2 segundos simulados)
- [ ] El indicador desaparece cuando aparece la respuesta del bot
- [ ] El indicador tiene un diseño coherente con el resto del chatbot (puntos animados, texto, etc.)

---

### RQ-010: Scroll Automático a Último Mensaje
**Prioridad:** Alta

El sistema debe desplazar automáticamente el área de mensajes hacia el mensaje más reciente cada vez que se agrega un nuevo mensaje (del usuario o del bot).

**Criterios de Aceptación:**
- [ ] Al enviar un mensaje, el scroll baja automáticamente
- [ ] Al recibir respuesta del bot, el scroll baja automáticamente
- [ ] La transición de scroll es suave (smooth scroll)
- [ ] El comportamiento funciona correctamente cuando hay muchos mensajes

---

### RQ-011: Service Mockeado con Estructura para Integración
**Prioridad:** Alta

El sistema debe implementar un service/módulo separado que simule las llamadas a la API, con estructura preparada para futura integración REST o WebSocket.

**Criterios de Aceptación:**
- [ ] Existe un archivo de service separado (ej: `chatService.ts`)
- [ ] El service expone una función `sendMessage(message: string, legajo: string)` que retorna una Promise
- [ ] El service simula latencia de red con `setTimeout` (opcional por RQ but helpful)
- [ ] El service incluye comentarios indicando dónde realizar la integración futura
- [ ] El service prepara estructura para enviar JSON: `{ message: string }`
- [ ] El service incluye lógica para obtener el número de legajo del localStorage y enviarlo como header

---

### RQ-012: Gestión de Número de Legajo desde LocalStorage
**Prioridad:** Alta

El sistema debe leer el número de legajo del estudiante desde el localStorage del navegador y prepararlo para ser enviado como header en las futuras llamadas a la API.

**Criterios de Aceptación:**
- [ ] El service intenta leer la clave `legajo` (o nombre definido) del localStorage
- [ ] Si no existe el legajo, se maneja el caso apropiadamente (logging, valor por defecto, etc.)
- [ ] El valor del legajo se incluye en la estructura preparada para el header HTTP
- [ ] Se incluyen comentarios en el código indicando cómo se usará en la integración real

---

## 3. Requisitos No Funcionales

### RQ-013: Rendimiento y Responsividad
**Prioridad:** Media

El sistema debe cargar y renderizar la interfaz del chatbot en menos de 2 segundos en conexiones de banda ancha estándar.

**Criterios de Aceptación:**
- [ ] El tiempo de carga inicial es menor a 2 segundos
- [ ] Las interacciones del usuario (envío de mensajes, scroll) responden inmediatamente (<100ms)
- [ ] No hay lag perceptible en la animación del indicador "escribiendo..."

---

### RQ-014: Usabilidad y Diseño Visual
**Prioridad:** Alta

El sistema debe tener una interfaz simple, limpia y visualmente atractiva que refleje la identidad institucional de UADE.

**Criterios de Aceptación:**
- [ ] El diseño es minimalista sin elementos distractores
- [ ] Los colores institucionales UADE (#00405c, #ffffff) se aplican consistentemente
- [ ] La tipografía es legible (tamaño mínimo 14px para mensajes)
- [ ] Los espaciados y márgenes son consistentes
- [ ] El contraste entre texto y fondo cumple estándares de accesibilidad básicos

---

### RQ-015: Compatibilidad de Navegadores (Desktop)
**Prioridad:** Media

El sistema debe funcionar correctamente en los navegadores de escritorio más utilizados en sus versiones recientes.

**Criterios de Aceptación:**
- [ ] Funciona en Chrome (últimas 2 versiones)
- [ ] Funciona en Firefox (últimas 2 versiones)
- [ ] Funciona en Edge (últimas 2 versiones)
- [ ] Funciona en Safari (últimas 2 versiones)
- [ ] El diseño se mantiene consistente en todos los navegadores listados

---

### RQ-016: Mantenibilidad y Calidad de Código
**Prioridad:** Alta

El sistema debe tener código limpio, bien estructurado y fácilmente mantenible para facilitar futuras modificaciones e integración con el backend.

**Criterios de Aceptación:**
- [ ] El código TypeScript no tiene errores de tipo
- [ ] Se siguen convenciones de nomenclatura consistentes
- [ ] Los componentes están adecuadamente separados por responsabilidad
- [ ] El código incluye comentarios en secciones críticas
- [ ] Se configuran ESLint y Prettier para mantener estándares de código

---

## 4. Constraints Técnicos

### RQ-017: Stack Tecnológico Base
**Prioridad:** Alta

**Descripción:** El sistema debe utilizar las siguientes tecnologías y herramientas obligatorias:

- **Framework:** React.js 18.x (última versión estable)
- **Lenguaje:** TypeScript 5.x
- **Bundler:** Create React App
- **Estilos:** CSS Vanilla (sin preprocessadores ni CSS-in-JS)
- **Gestión de Estado:** useState de React (hooks locales)

**Criterios de Aceptación:**
- [ ] El proyecto se inicializa con Create React App + TypeScript template
- [ ] No se utilizan librerías de UI pesadas (Material-UI, Ant Design, Chakra, etc.)
- [ ] Los estilos se escriben en archivos `.css` separados
- [ ] No se instalan librerías de gestión de estado global (Redux, Zustand, MobX, etc.)

---

### RQ-018: Minimalismo en Dependencias
**Prioridad:** Alta

**Descripción:** El sistema debe evitar la instalación de dependencias innecesarias, limitándose a las estrictamente necesarias para desarrollo.

**Criterios de Aceptación:**
- [ ] El `package.json` contiene menos de 10 dependencias de producción
- [ ] No se instalan librerías para funcionalidades que pueden implementarse fácilmente de forma nativa
- [ ] Las dependencias de desarrollo se limitan a: ESLint, Prettier, TypeScript, y tipos necesarios

---

### RQ-019: Estructura de Proyecto Estándar
**Prioridad:** Media

**Descripción:** El sistema debe seguir una estructura de carpetas convencional de React que facilite la navegación y el mantenimiento.

**Sugerencia de Estructura:**
```
src/
  ├── components/
  │   ├── Chat.tsx
  │   ├── Chat.css
  │   ├── Message.tsx
  │   ├── Message.css
  │   └── ChatInput.tsx
  ├── services/
  │   └── chatService.ts
  ├── types/
  │   └── chat.types.ts
  ├── App.tsx
  ├── App.css
  └── index.tsx
```

**Criterios de Aceptación:**
- [ ] Los componentes están en carpeta `components/`
- [ ] Los services están en carpeta `services/`
- [ ] Los tipos TypeScript están centralizados (carpeta `types/` o archivos `.types.ts`)
- [ ] Cada componente tiene su archivo CSS correspondiente

---

### RQ-020: Configuración de Linting y Formatting
**Prioridad:** Media

**Descripción:** El sistema debe incluir configuración de ESLint y Prettier para mantener consistencia en el estilo de código.

**Criterios de Aceptación:**
- [ ] Existe archivo `.eslintrc.json` o similar con reglas básicas
- [ ] Existe archivo `.prettierrc` con configuración estándar
- [ ] Se pueden ejecutar comandos `npm run lint` y `npm run format`
- [ ] El código pasa las validaciones de ESLint sin errores críticos

---

### RQ-021: Preparación para Integración API
**Prioridad:** Alta

**Descripción:** El service mockeado debe estar estructurado para facilitar la transición a integración real con API REST o WebSocket.

**Detalles Técnicos:**
- **Endpoint futuro:** TBD (REST o WebSocket)
- **Formato Request:** `{ message: string }`
- **Header requerido:** `legajo` (obtenido de localStorage)
- **Formato Response:** TBD (a definir según backend)

**Criterios de Aceptación:**
- [ ] El service tiene comentarios `// TODO: Replace with actual API call`
- [ ] La función del service tiene firma compatible con fetch/axios
- [ ] Se incluye lógica para construir headers con el legajo
- [ ] Se incluyen ejemplos comentados de cómo hacer la llamada REST y WebSocket

---

## 5. Métricas de Éxito

### RQ-022: Verificación Visual y Funcional
**Prioridad:** Alta

**Descripción:** El proyecto cumple su objetivo cuando se verifica visualmente que:

1. **Diseño:** El chatbot se ve profesional con colores institucionales UADE
2. **Funcionalidad:** Se pueden enviar mensajes y recibir respuestas hardcodeadas
3. **Preparación:** El service está claramente estructurado para integración futura

**Indicadores Cuantitativos:**
- [ ] 100% de los elementos visuales especificados están presentes
- [ ] 0 errores en consola del navegador al cargar la aplicación
- [ ] 0 warnings de TypeScript al compilar
- [ ] Tiempo de respuesta del bot mockeado: 1-2 segundos consistentes

---

### RQ-023: Facilidad de Integración
**Prioridad:** Alta

**Descripción:** Un desarrollador debe poder integrar la API real modificando únicamente el archivo `chatService.ts` sin tocar componentes de UI.

**Criterios de Aceptación:**
- [ ] El service está completamente desacoplado de los componentes
- [ ] La interfaz del service (tipos de entrada/salida) está bien definida
- [ ] Existe documentación inline de cómo realizar la integración

---

## 6. Prioridad y Trazabilidad

| ID | Descripción | Prioridad | Categoría |
|---|---|---|---|
| RQ-001 | Visualización centrada del chatbot | Alta | Funcional |
| RQ-002 | Header con avatar y título "UadeBot" | Alta | Funcional |
| RQ-003 | Área de visualización de mensajes | Alta | Funcional |
| RQ-004 | Input multilinea | Alta | Funcional |
| RQ-005 | Botón de envío | Alta | Funcional |
| RQ-006 | Validación mensajes vacíos | Alta | Funcional |
| RQ-007 | Envío con Enter | Media | Funcional |
| RQ-008 | Respuesta hardcodeada del bot | Alta | Funcional |
| RQ-009 | Indicador "escribiendo..." | Alta | Funcional |
| RQ-010 | Scroll automático | Alta | Funcional |
| RQ-011 | Service mockeado estructurado | Alta | Funcional |
| RQ-012 | Gestión de legajo desde localStorage | Alta | Funcional |
| RQ-013 | Rendimiento y responsividad | Media | No Funcional |
| RQ-014 | Usabilidad y diseño visual | Alta | No Funcional |
| RQ-015 | Compatibilidad navegadores | Media | No Funcional |
| RQ-016 | Mantenibilidad de código | Alta | No Funcional |
| RQ-017 | Stack tecnológico base | Alta | Técnico |
| RQ-018 | Minimalismo en dependencias | Alta | Técnico |
| RQ-019 | Estructura de proyecto | Media | Técnico |
| RQ-020 | Linting y formatting | Media | Técnico |
| RQ-021 | Preparación integración API | Alta | Técnico |
| RQ-022 | Verificación visual y funcional | Alta | Métrica |
| RQ-023 | Facilidad de integración | Alta | Métrica |

---

## 7. Información de Diseño

### Paleta de Colores UADE (Extraída del Logo)

**Colores Principales:**
- **Azul UADE Principal:** `#00405c` (RGB: 0, 64, 92)
- **Blanco:** `#ffffff` (RGB: 255, 255, 255)

**Sugerencias de Aplicación:**
- **Fondo de página:** Color oscuro (ej: `#1a1a1a`, `#2d2d2d`)
- **Contenedor del chatbot:** Blanco (`#ffffff`) con sombra sutil
- **Header del chatbot:** Azul UADE (`#00405c`) con texto blanco
- **Mensajes del bot:** Fondo gris muy claro (`#f5f5f5`) con texto oscuro
- **Mensajes del usuario:** Fondo azul UADE (`#00405c`) con texto blanco
- **Botón enviar:** Azul UADE (`#00405c`) con hover ligeramente más claro
- **Indicador "escribiendo":** Azul UADE (`#00405c`)

---

## 8. Estructura del Service Mockeado

### Interfaz de Tipos (chat.types.ts)

```typescript
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatServiceConfig {
  apiUrl?: string;
  legajo: string | null;
}
```

### Service Mockeado (chatService.ts)

```typescript
// chatService.ts
import { ChatMessage } from '../types/chat.types';

/**
 * Servicio de chat mockeado
 * TODO: Reemplazar con integración real a API REST o WebSocket
 */

// Obtener legajo del localStorage
const getLegajoFromStorage = (): string | null => {
  try {
    return localStorage.getItem('legajo');
  } catch (error) {
    console.error('Error al leer legajo del localStorage:', error);
    return null;
  }
};

/**
 * Envía un mensaje al chatbot
 * @param message - Mensaje del usuario
 * @returns Promise con la respuesta del bot
 */
export const sendMessage = async (message: string): Promise<string> => {
  const legajo = getLegajoFromStorage();
  
  // TODO: Reemplazar con llamada real a la API
  // Estructura del request:
  // const requestBody = { message };
  // const headers = {
  //   'Content-Type': 'application/json',
  //   'legajo': legajo || 'UNKNOWN'
  // };
  
  // Ejemplo REST API:
  // const response = await fetch('API_URL/chat', {
  //   method: 'POST',
  //   headers,
  //   body: JSON.stringify(requestBody)
  // });
  // return await response.json();
  
  // Ejemplo WebSocket:
  // socket.send(JSON.stringify({ message, legajo }));
  
  // MOCK: Simulación de respuesta con delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        'Hola, soy UadeBot. Esta es una respuesta de prueba. Pronto estaré conectado con el sistema real para ayudarte con tus consultas académicas y administrativas.'
      );
    }, 1500); // Simula 1.5s de latencia
  });
};
```

---

## 9. Documentación Requerida

### README.md

El proyecto debe incluir un archivo README.md con:

1. **Descripción del Proyecto**
   - Breve explicación de qué es UadeBot
   - Contexto académico

2. **Requisitos Previos**
   - Node.js versión requerida
   - npm/yarn

3. **Instalación**
   ```bash
   npm install
   ```

4. **Ejecución en Desarrollo**
   ```bash
   npm start
   ```

5. **Build para Producción**
   ```bash
   npm run build
   ```

6. **Configuración del Número de Legajo**
   - Instrucciones para establecer el legajo en localStorage:
   ```javascript
   localStorage.setItem('legajo', '12345678');
   ```

7. **Estructura del Proyecto**
   - Breve explicación de carpetas principales

8. **Integración Futura con API**
   - Referencia al archivo `chatService.ts`
   - Pasos básicos para integrar

9. **Scripts Disponibles**
   - `npm start`: Desarrollo
   - `npm run build`: Producción
   - `npm run lint`: Linting
   - `npm run format`: Formatting

---

## 10. Preguntas Abiertas

### Pendientes de Definición Futura

1. **¿Cuál será el formato exacto de la respuesta de la API?**
   - Por ahora se asume string simple
   - Podría ser JSON estructurado con metadata

2. **¿Se necesitará manejo de errores de API en esta primera versión?**
   - Actualmente el mock siempre responde exitosamente
   - En integración real se necesitará manejo de errores HTTP, timeouts, etc.

3. **¿El legajo debe validarse o solo leerse del localStorage?**
   - Actualmente solo se lee
   - ¿Se necesita validación de formato?

4. **¿Habrá diferentes tipos de mensajes del bot?** (texto, imágenes, links, etc.)
   - Por ahora solo texto plano
   - Considerar para futuras iteraciones

5. **¿Se necesitará historial persistente de conversaciones?**
   - Actualmente no se persiste nada
   - Los mensajes se pierden al recargar
   - ¿Implementar en el futuro?

---

## 11. Notas Adicionales

### Consideraciones para el Desarrollador

- **Accesibilidad:** Aunque no es requisito crítico, considerar usar roles ARIA básicos (`role="log"` para mensajes)
- **Testing:** No se requiere testing en esta versión inicial, pero la estructura modular facilitará testing futuro
- **Animaciones:** Las animaciones deben ser sutiles y no distraer (fade-in de mensajes, typing indicator con dots animados)
- **Avatar del Robot:** Puede ser un emoji (🤖), un SVG simple, o un icono de una librería de iconos liviana
- **Extensibilidad:** Pensar en que futuras versiones puedan incluir autenticación, sesiones múltiples, etc.

### Recursos Útiles

- **Colores UADE:** `#00405c` (principal), `#ffffff` (secundario)
- **LocalStorage Key:** `legajo`
- **Respuesta Mock:** String hardcodeado en `chatService.ts`

---

**Ubicación del Archivo:** `.docs/req-uade-chatbot.md`

**Fecha de Creación:** 17 de Octubre, 2025

**Versión:** 1.0

**Estado:** Listo para Implementación
