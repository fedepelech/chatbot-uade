# 🐳 UadeBot - Docker Setup (Prueba de Concepto)

## Inicio Rápido

### 1. Iniciar todos los servicios

```bash
docker-compose up --build
```

### 2. Descargar el modelo de Ollama (primera vez)

En otra terminal:

```bash
docker exec -it chatbot-uade-ollama-1 ollama pull llama3.2:3b-instruct-q4_K_M
```

### 3. Acceder a la aplicación

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:4000
- **Ollama:** http://localhost:11434

## Comandos Útiles

```bash
# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Limpiar todo
docker-compose down -v
```

## Estructura

```
├── frontend/          # React app (puerto 3000)
├── backend/           # Node.js API (puerto 4000)
└── ollama/            # LLM service (puerto 11434)
```

## Notas

- Primera ejecución puede tardar 10-15 minutos (descarga de modelo)
- Los modelos se guardan en un volumen Docker persistente
- Hot reload habilitado en frontend y backend
