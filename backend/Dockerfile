FROM node:18-alpine

# Instalar curl para el script de pull de modelos
RUN apk add --no-cache curl bash

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copiar el script primero y dar permisos
COPY pull-models.sh ./
RUN chmod +x pull-models.sh

# Copiar el resto de archivos
COPY . .

EXPOSE 4000

# Usar el script como entrypoint para descargar modelos antes de iniciar
ENTRYPOINT ["/bin/bash", "/app/pull-models.sh"]
CMD ["npx", "tsx", "index.ts"]
