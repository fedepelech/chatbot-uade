## Archivos Relevantes

- `src/components/Chat.tsx` - Contenedor principal del chatbot; layout centrado y estructura general (RQ-001, RQ-003).
- `src/components/Chat.css` - Estilos para layout, header, colores UADE y fondo oscuro (RQ-001, RQ-002, RQ-014).
- `src/components/Message.tsx` - Componente de burbuja de mensaje con diferenciación usuario/bot (RQ-003).
- `src/components/Message.css` - Estilos de mensajes: alineación, colores y avatar (RQ-003, RQ-014).
- `src/components/ChatInput.tsx` - Input multilinea con placeholder, botón Enviar y validaciones (RQ-004, RQ-005, RQ-006, RQ-007).
- `src/services/chatService.ts` - Service mockeado para enviar mensajes; simula latencia, lee `legajo` y deja TODOs para integración (RQ-008, RQ-011, RQ-012, RQ-021).
- `src/types/chat.types.ts` - Tipos TS (`ChatMessage`, `ChatServiceConfig`) centralizados (RQ-019, RQ-023).
- `src/App.tsx` - Punto de composición de la app, monta `Chat` (RQ-017).
- `src/App.css` - Estilos globales, variables de color UADE, fondo oscuro (RQ-014).
- `src/index.tsx` - Entry point de React 18 con TypeScript (RQ-017).
- `src/assets/robot.svg` - Avatar del robot para el header (opcional; puede usarse emoji) (RQ-002).
- `.eslintrc.json` - Reglas básicas de ESLint para TS/React (RQ-016, RQ-020).
- `.prettierrc` - Configuración de Prettier (RQ-020).
- `README.md` - Documentación de instalación, ejecución, legajo y notas de integración (RQ-022, RQ-023).

- `src/components/Chat.test.tsx` - (Opcional) Render del contenedor centrado y header visible (Tests opcionales).
- `src/components/Message.test.tsx` - (Opcional) Estilos/alineación por `sender` y contenido (Tests opcionales).
- `src/components/ChatInput.test.tsx` - (Opcional) Enter/Shift+Enter, validación de vacío y estado disabled (Tests opcionales).

### Notas

- Las pruebas unitarias generalmente deben ubicarse junto a los archivos que prueban (ej: `Chat.tsx` y `Chat.test.tsx`).
- Create React App usa Jest por defecto. Ejecuta `npm test` (o `npx jest` si está configurado) para correr pruebas.
- En esta versión inicial, los tests son opcionales según el PRD; pueden añadirse para validar criterios críticos.

## Tareas

- [ ] 1.0 Inicializar proyecto React + TypeScript con CRA y estructura base (RQ-017, RQ-018, RQ-019)
  - [ ] 1.1 Inicializar el proyecto con Create React App (template TypeScript).
  - [ ] 1.2 Eliminar boilerplate innecesario (logos, pruebas default) dejando una base limpia.
  - [ ] 1.3 Crear estructura de carpetas sugerida en `src/` (`components/`, `services/`, `types/`).
  - [ ] 1.4 Configurar variables de color UADE en `App.css` (ej: `--uade-blue: #00405c; --white: #ffffff`).
  - [ ] 1.5 Verificar que `npm start` levante sin errores de TypeScript.
  - [ ] 1.6 Revisar `package.json` para asegurar < 10 dependencias de producción (RQ-018).

- [ ] 2.0 Implementar UI del chatbot centrado con header “UadeBot” e identidad UADE (RQ-001, RQ-002, RQ-014)
  - [ ] 2.1 Crear `Chat.tsx` como contenedor del chatbot con layout centrado vertical y horizontal.
  - [ ] 2.2 Establecer fondo de página oscuro y contenedor blanco con sombra sutil en `Chat.css`.
  - [ ] 2.3 Implementar header con avatar (emoji o `robot.svg`) y título “UadeBot” usando `#00405c` y texto blanco.
  - [ ] 2.4 Asegurar centrado consistente mínimo en 1024x768 y resoluciones superiores.
  - [ ] 2.5 Validar contraste y legibilidad (tamaño fuente, espaciados) según RQ-014.

- [ ] 3.0 Construir componentes de chat: área de mensajes, input multilinea y botón enviar con validación (RQ-003, RQ-004, RQ-005, RQ-006)
  - [ ] 3.1 Crear `Message.tsx` con props (`id`, `text`, `sender`, `timestamp`); estilos diferenciados usuario/bot.
  - [ ] 3.2 Implementar `Message.css` con alineación derecha para usuario e izquierda para bot con avatar.
  - [ ] 3.3 Crear `ChatInput.tsx` con `textarea` multilinea, placeholder “Escribe tu consulta...” y auto-crecimiento con límite.
  - [ ] 3.4 Agregar botón “Enviar” a la derecha del input; estado `disabled` cuando el texto está vacío o solo espacios.
  - [ ] 3.5 Conectar `Chat.tsx` con `ChatInput.tsx`: manejar estado `messages` (`useState<ChatMessage[]>`) y agregar mensajes del usuario.

- [ ] 4.0 Implementar interacciones: Enter/Shift+Enter, indicador “escribiendo…”, scroll al último mensaje (RQ-007, RQ-009, RQ-010)
  - [ ] 4.1 En `ChatInput.tsx`, enviar con Enter (sin Shift) y agregar nueva línea con Shift+Enter; limpiar input al enviar.
  - [ ] 4.2 En `Chat.tsx`, mostrar indicador “escribiendo...” cuando se envía un mensaje y ocultarlo al recibir respuesta.
  - [ ] 4.3 Aplicar scroll automático al último mensaje al enviar/recibir (usar ref + `scrollIntoView` o `scrollTop`); transición suave.
  - [ ] 4.4 Añadir animaciones sutiles (fade-in de mensajes, dots para typing) sin aumentar dependencias.

- [ ] 5.0 Crear service mockeado `chatService.ts`, tipos y lectura de `legajo` desde localStorage (RQ-008, RQ-011, RQ-012, RQ-021)
  - [ ] 5.1 Definir `ChatMessage` y `ChatServiceConfig` en `src/types/chat.types.ts` (según snippet del PRD).
  - [ ] 5.2 Implementar `sendMessage(message: string): Promise<string>` en `src/services/chatService.ts` leyendo `legajo` de `localStorage`.
  - [ ] 5.3 Simular latencia de 1–2s con `setTimeout` y devolver string hardcodeado.
  - [ ] 5.4 Incluir comentarios `// TODO: Replace with actual API call` con ejemplos de REST/WebSocket y header `legajo`.
  - [ ] 5.5 Manejar ausencia de `legajo` (fallback `UNKNOWN`, logging no intrusivo).
  - [ ] 5.6 Integrar el service en `Chat.tsx`: setear `isTyping`, esperar respuesta y agregar mensaje del bot.

- [ ] 6.0 Configurar calidad de código: ESLint, Prettier y scripts (RQ-016, RQ-020)
  - [ ] 6.1 Crear `.eslintrc.json` con reglas básicas TS/React (compatibles con CRA/TS 5.x).
  - [ ] 6.2 Crear `.prettierrc` con formato estándar (ancho de línea, comillas, semicolons, etc.).
  - [ ] 6.3 Agregar scripts `npm run lint` y `npm run format` en `package.json`.
  - [ ] 6.4 Ejecutar lint/format y corregir hasta 0 errores críticos; mantener warnings al mínimo.
  - [ ] 6.5 Confirmar compilación sin warnings de TypeScript.

- [ ] 7.0 Documentar y verificar métricas/compatibilidad: README, rendimiento y navegadores (RQ-013, RQ-015, RQ-022, RQ-023)
  - [ ] 7.1 Escribir `README.md` con descripción, requisitos, instalación, scripts y guía para `legajo`.
  - [ ] 7.2 Añadir sección “Integración futura” referenciando `chatService.ts` y pasos básicos.
  - [ ] 7.3 Verificar tiempo de carga < 2s y respuesta del mock 1–2s.
  - [ ] 7.4 Validar funcionamiento en Chrome, Firefox, Edge y Safari (últimas 2 versiones).
  - [ ] 7.5 Completar checklist de verificación visual/funcional (RQ-022) y facilidad de integración (RQ-023).
