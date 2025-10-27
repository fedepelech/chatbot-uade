#!/bin/bash

# Script para descargar modelos de Ollama automÃ¡ticamente

echo "ðŸ”„ Iniciando descarga de modelos de Ollama..."

# Esperar a que Ollama estÃ© disponible
echo "â³ Esperando a que Ollama estÃ© listo..."
until curl -s http://ollama:11434/api/tags > /dev/null 2>&1; do
  echo "   Ollama no estÃ¡ listo aÃºn, esperando..."
  sleep 2
done

echo "âœ… Ollama estÃ¡ listo!"

# Descargar modelo LLM principal
echo "ðŸ“¥ Descargando modelo LLM: llama3.2:3b-instruct-q4_K_M..."
curl -X POST http://ollama:11434/api/pull -d '{
  "name": "llama3.2:3b-instruct-q4_K_M"
}'

echo ""
echo "ðŸ“¥ Descargando modelo de embeddings: nomic-embed-text..."
curl -X POST http://ollama:11434/api/pull -d '{
  "name": "nomic-embed-text"
}'

echo ""
echo "âœ… Todos los modelos descargados exitosamente!"
echo "ðŸš€ Iniciando backend..."

# Ejecutar el comando original del contenedor
exec "$@"
