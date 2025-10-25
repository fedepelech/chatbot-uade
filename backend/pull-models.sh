#!/bin/bash

# Script para descargar modelos de Ollama automáticamente

echo "🔄 Iniciando descarga de modelos de Ollama..."

# Esperar a que Ollama esté disponible
echo "⏳ Esperando a que Ollama esté listo..."
until curl -s http://ollama:11434/api/tags > /dev/null 2>&1; do
  echo "   Ollama no está listo aún, esperando..."
  sleep 2
done

echo "✅ Ollama está listo!"

# Descargar modelo LLM principal
echo "📥 Descargando modelo LLM: llama3.2:3b-instruct-q4_K_M..."
curl -X POST http://ollama:11434/api/pull -d '{
  "name": "llama3.2:3b-instruct-q4_K_M"
}'

echo ""
echo "📥 Descargando modelo de embeddings: nomic-embed-text..."
curl -X POST http://ollama:11434/api/pull -d '{
  "name": "nomic-embed-text"
}'

echo ""
echo "✅ Todos los modelos descargados exitosamente!"
echo "🚀 Iniciando backend..."

# Ejecutar el comando original del contenedor
exec "$@"
