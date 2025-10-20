# UadeBot - Chatbot Académico

## 📋 Descripción del Proyecto

UadeBot es una aplicación web de página única (SPA) desarrollada en React.js con TypeScript que implementa un chatbot académico para estudiantes de UADE. El chatbot sirve como asistente virtual para proporcionar respuestas a consultas específicas de usuarios y consultas administrativas generales de la facultad.

### Contexto Académico

Este proyecto es parte del desarrollo de un sistema de chatbot inteligente que utilizará Model Context Protocol (MCP) para proporcionar contexto a un LLM (Large Language Model). La versión actual implementa el frontend con un service mockeado, preparado para futura integración con el backend.

## 🎨 Características

- ✅ Interfaz centrada con diseño institucional UADE
- ✅ Chat interactivo con mensajes diferenciados (usuario/bot)
- ✅ Input multilinea con validación
- ✅ Indicador visual "escribiendo..."
- ✅ Scroll automático a mensajes recientes
- ✅ Respuestas simuladas con latencia realista (1-2s)
- ✅ Preparado para integración con API REST o WebSocket
- ✅ Gestión de número de legajo desde localStorage

## 🛠️ Stack Tecnológico

- **Framework:** React 18.x
- **Lenguaje:** TypeScript 5.x
- **Bundler:** Create React App
- **Estilos:** CSS Vanilla
- **Gestión de Estado:** React Hooks (useState, useEffect, useRef)
- **Calidad de Código:** ESLint + Prettier

## 📦 Requisitos Previos

- **Node.js:** v16 o superior
- **npm:** v7 o superior (incluido con Node.js)

## 🚀 Instalación

1. Clonar el repositorio (si aplica) o navegar al directorio del proyecto:

```bash
cd chatbot-uade/frontend
```

2. Instalar dependencias:

```bash
npm install
```

## 💻 Scripts Disponibles

### Desarrollo

```bash
npm start
```

Inicia el servidor de desarrollo en [http://localhost:3000](http://localhost:3000).
La página se recargará automáticamente al hacer cambios.

### Build de Producción

```bash
npm run build
```

Genera una versión optimizada para producción en la carpeta `build/`.
Los archivos están minificados y listos para despliegue.

### Linting

```bash
npm run lint
```

Ejecuta ESLint para verificar la calidad del código.

```bash
npm run lint:fix
```

Ejecuta ESLint y corrige automáticamente los errores que sea posible.

### Formateo

```bash
npm run format
```

Formatea todos los archivos del proyecto con Prettier.

```bash
npm run format:check
```

Verifica el formato sin modificar archivos.

## 🔧 Configuración del Número de Legajo

El chatbot lee el número de legajo del estudiante desde `localStorage` para enviarlo en futuras llamadas a la API.

### Configurar el legajo manualmente:

1. Abrir la consola del navegador (F12)
2. Ejecutar el siguiente comando:

```javascript
localStorage.setItem('legajo', '12345678');
```

3. Recargar la página

### Verificar el legajo actual:

```javascript
localStorage.getItem('legajo');
```

### Eliminar el legajo:

```javascript
localStorage.removeItem('legajo');
```

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── Chat.tsx        # Contenedor principal del chatbot
│   ├── Chat.css        # Estilos del contenedor
│   ├── Message.tsx     # Componente de mensaje individual
│   ├── Message.css     # Estilos de mensajes
│   ├── ChatInput.tsx   # Input multilinea con botón enviar
│   └── ChatInput.css   # Estilos del input
├── services/           # Servicios y lógica de negocio
│   └── chatService.ts  # Service mockeado para API
├── types/              # Definiciones de tipos TypeScript
│   └── chat.types.ts   # Tipos del chat (ChatMessage, etc.)
├── App.tsx             # Componente raíz
├── App.css             # Estilos globales y variables
└── index.tsx           # Entry point de la aplicación
```

## 🔌 Integración Futura con API

El proyecto está estructurado para facilitar la integración con una API real. El archivo `src/services/chatService.ts` contiene comentarios detallados sobre cómo realizar la integración.

### Pasos para integrar:

1. **Abrir** `src/services/chatService.ts`
2. **Localizar** los comentarios `// TODO: Replace with actual API call`
3. **Reemplazar** la lógica mockeada con llamadas reales

### Ejemplo de integración REST:

```typescript
export const sendMessage = async (message: string): Promise<string> => {
  const legajo = getLegajoFromStorage();

  const response = await fetch('https://api.example.com/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      legajo: legajo || 'UNKNOWN',
    },
    body: JSON.stringify({ message }),
  });

  const data = await response.json();
  return data.response;
};
```

### Ejemplo de integración WebSocket:

```typescript
const ws = new WebSocket('wss://api.example.com/chat');

ws.onopen = () => {
  ws.send(JSON.stringify({ message, legajo }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  return data.response;
};
```

### Formato esperado:

- **Request:** `{ message: string }`
- **Headers:** `{ 'legajo': string }`
- **Response:** `{ response: string }` (o el formato que defina el backend)

## 🎨 Paleta de Colores UADE

El proyecto utiliza la identidad visual institucional de UADE:

- **Azul UADE Principal:** `#00405c` (RGB: 0, 64, 92)
- **Blanco:** `#ffffff`
- **Fondo Oscuro:** `#1a1a1a`
- **Gris Claro:** `#f5f5f5`
- **Texto Oscuro:** `#333333`

Las variables CSS están definidas en `src/App.css` y pueden modificarse según necesidad.

## ✅ Verificación y Testing

### Checklist de Funcionalidades:

- [x] Chatbot centrado vertical y horizontalmente
- [x] Header con avatar y título "UadeBot"
- [x] Mensajes del usuario alineados a la derecha (fondo azul)
- [x] Mensajes del bot alineados a la izquierda (fondo gris)
- [x] Input multilinea con placeholder
- [x] Botón "Enviar" deshabilitado cuando input vacío
- [x] Enter envía mensaje, Shift+Enter nueva línea
- [x] Indicador "escribiendo..." con puntos animados
- [x] Scroll automático al último mensaje
- [x] Respuesta del bot después de 1-2 segundos
- [x] Lectura de legajo desde localStorage
- [x] Manejo de errores con mensaje amigable

### Verificación Manual:

1. Ejecutar `npm start`
2. Abrir [http://localhost:3000](http://localhost:3000)
3. Configurar legajo en localStorage
4. Enviar mensajes y verificar comportamiento
5. Verificar responsive en diferentes tamaños de ventana

## 🌐 Compatibilidad de Navegadores

El proyecto es compatible con las últimas 2 versiones de:

- ✅ Google Chrome
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ✅ Safari

## 📊 Métricas de Rendimiento

- **Tiempo de carga inicial:** < 2 segundos
- **Tiempo de respuesta del bot (mock):** 1-2 segundos
- **Tamaño del bundle (gzip):**
  - JavaScript: ~61 KB
  - CSS: ~1.5 KB

## 🐛 Troubleshooting

### El bot no responde:

- Verificar que no haya errores en la consola del navegador
- Verificar que el service `chatService.ts` esté importado correctamente

### El legajo no se envía:

- Verificar que el legajo esté configurado en localStorage
- Abrir consola y verificar logs: "Legajo: XXXXXX"

### Errores de compilación:

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 👥 Contribución

Este proyecto sigue las convenciones de código definidas por ESLint y Prettier. Antes de hacer commit:

```bash
npm run lint
npm run format
npm run build
```

## 📝 Notas Adicionales

- Los comentarios `// TODO` en `chatService.ts` son intencionales y marcan puntos de integración futura
- El proyecto no incluye tests en esta versión inicial, pero la estructura modular facilita su implementación
- Las animaciones son sutiles para no distraer al usuario

## 📄 Licencia

Este proyecto es parte de un trabajo académico para UADE.

---

**Versión:** 1.0  
**Fecha:** Octubre 2025  
**Estado:** Listo para Integración con Backend
