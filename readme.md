# 🔄 Proceso de Desarrollo y Testing

Guía rápida para probar cambios en el código cuando los contenedores ya están corriendo.

---

## 📝 Escenarios Comunes

### 1️⃣ Cambios en el Frontend (React)

#### ✅ Hot Reload Automático

Si solo modificas archivos `.tsx`, `.ts`, `.jsx`, `.js`, `.css`:

```bash
# ¡No necesitas hacer nada!
# Los cambios se reflejan automáticamente en http://localhost:3000
```

**Cómo funciona:**
- El volumen `./frontend:/app` está montado
- `npm start` tiene hot reload habilitado
- Guarda el archivo y recarga el navegador

#### 🔄 Si necesitas reinstalar dependencias

Si modificaste `package.json` (agregaste/eliminaste paquetes):

```bash
# Reconstruir solo el frontend
docker-compose up -d --build frontend

# Ver logs para confirmar
docker-compose logs -f frontend
```

---

### 2️⃣ Cambios en el Backend (Node.js + TypeScript)

#### ✅ Hot Reload Automático

Si modificas archivos `.ts` en `/backend`:

```bash
# ¡No necesitas hacer nada!
# tsx tiene hot reload automático
```

**Cómo funciona:**
- El volumen `./backend:/app` está montado
- `tsx` recarga automáticamente al detectar cambios
- Los cambios se aplican en segundos

#### 🔄 Si necesitas reinstalar dependencias

Si modificaste `package.json`:

```bash
# Reconstruir solo el backend
docker-compose up -d --build backend

# Ver logs para confirmar
docker-compose logs -f backend
```

#### 🔄 Si modificaste archivos de datos

Si cambiaste archivos en `/backend/data` o `/backend/config`:

```bash
# ¡No necesitas hacer nada!
# Los cambios se leen en la próxima request
```

---

### 3️⃣ Cambios en Ollama / Modelo

#### Cambiar de modelo

Si quieres probar otro modelo:

```bash
# 1. Descargar el nuevo modelo
docker exec -it chatbot-uade-ollama-1 ollama pull nombre-del-modelo

# 2. Actualizar variable de entorno en docker-compose.yml
# LLM_MODEL=nombre-del-modelo

# 3. Reiniciar solo el backend
docker-compose restart backend
```

#### Ver modelos disponibles

```bash
docker exec -it chatbot-uade-ollama-1 ollama list
```

---

## 🛠️ Comandos de Desarrollo Frecuentes

### Ver logs en tiempo real

```bash
# Todos los servicios
docker-compose logs -f

# Solo frontend
docker-compose logs -f frontend

# Solo backend
docker-compose logs -f backend

# Solo Ollama
docker-compose logs -f ollama

# Últimas 50 líneas del backend
docker-compose logs --tail=50 backend
```

### Reiniciar servicios

```bash
# Reiniciar solo el frontend
docker-compose restart frontend

# Reiniciar solo el backend
docker-compose restart backend

# Reiniciar todo
docker-compose restart
```

### Reconstruir después de cambios importantes

```bash
# Reconstruir solo frontend
docker-compose up -d --build frontend

# Reconstruir solo backend
docker-compose up -d --build backend

# Reconstruir todo
docker-compose up -d --build
```

### Acceder a shell de un contenedor

```bash
# Shell del frontend
docker exec -it chatbot-uade-frontend-1 sh

# Shell del backend
docker exec -it chatbot-uade-backend-1 sh

# Shell de Ollama
docker exec -it chatbot-uade-ollama-1 bash
```

---

## 🐛 Debugging

### Ver estado de los contenedores

```bash
docker-compose ps
```

### Ver uso de recursos

```bash
docker stats
```

### Inspeccionar un contenedor

```bash
# Ver configuración completa del backend
docker inspect chatbot-uade-backend-1

# Ver solo las variables de entorno
docker inspect chatbot-uade-backend-1 | grep -A 20 Env
```

### Verificar conectividad entre servicios

```bash
# Desde el backend, hacer ping a Ollama
docker exec -it chatbot-uade-backend-1 wget -O- http://ollama:11434/api/tags

# Desde el frontend, verificar backend
docker exec -it chatbot-uade-frontend-1 wget -O- http://backend:4000/health
```

---

## 🔥 Problemas Comunes

### Frontend no refleja cambios

```bash
# 1. Verificar que el contenedor esté corriendo
docker-compose ps frontend

# 2. Ver logs por errores
docker-compose logs -f frontend

# 3. Limpiar cache del navegador (Ctrl+Shift+R)

# 4. Si nada funciona, reconstruir
docker-compose up -d --build frontend
```

### Backend no refleja cambios

```bash
# 1. Verificar logs
docker-compose logs -f backend

# 2. Verificar que tsx esté corriendo
docker exec -it chatbot-uade-backend-1 ps aux | grep tsx

# 3. Reiniciar el backend
docker-compose restart backend

# 4. Si hay error de sintaxis, corregir y guardar
# tsx detectará el cambio automáticamente
```

### Ollama no responde

```bash
# 1. Verificar que esté corriendo
docker-compose ps ollama

# 2. Ver logs
docker-compose logs -f ollama

# 3. Verificar que el modelo esté descargado
docker exec -it chatbot-uade-ollama-1 ollama list

# 4. Reiniciar Ollama
docker-compose restart ollama
```

### Error "Cannot find module"

```bash
# Reinstalar dependencias
docker-compose up -d --build backend
# o
docker-compose up -d --build frontend
```

---

## 📊 Workflow Típico de Desarrollo

### Escenario: Agregar una nueva feature al backend

```bash
# 1. Editar código en tu IDE
# Ejemplo: backend/index.ts

# 2. Guardar el archivo
# tsx detecta el cambio y recarga automáticamente

# 3. Ver logs para confirmar
docker-compose logs -f backend

# 4. Probar en el navegador o con curl
curl http://localhost:4000/nueva-ruta

# 5. Si hay errores, corregir y guardar
# El proceso se repite automáticamente
```

### Escenario: Modificar el frontend

```bash
# 1. Editar componente React
# Ejemplo: frontend/src/components/Chat.tsx

# 2. Guardar el archivo
# React hot reload se activa automáticamente

# 3. Ver cambios en http://localhost:3000
# El navegador se recarga automáticamente

# 4. Si hay errores, ver consola del navegador
# o logs: docker-compose logs -f frontend
```

### Escenario: Agregar nueva dependencia

```bash
# 1. Agregar al package.json manualmente
# o usar npm install localmente (si tienes Node instalado)

# 2. Reconstruir el contenedor
docker-compose up -d --build backend
# o
docker-compose up -d --build frontend

# 3. Verificar que instaló correctamente
docker-compose logs backend | grep "added"
```

---

## 🚀 Optimización del Workflow

### Usar alias para comandos frecuentes

Agrega a tu `~/.bashrc` o `~/.zshrc`:

```bash
# Alias para UadeBot
alias dc='docker-compose'
alias dcl='docker-compose logs -f'
alias dcr='docker-compose restart'
alias dcb='docker-compose up -d --build'

# Uso:
# dcl backend    → Ver logs del backend
# dcr frontend   → Reiniciar frontend
# dcb            → Reconstruir todo
```

### Abrir múltiples terminales

Terminal 1: Logs del backend
```bash
docker-compose logs -f backend
```

Terminal 2: Logs del frontend
```bash
docker-compose logs -f frontend
```

Terminal 3: Comandos de desarrollo
```bash
# Aquí ejecutas comandos según necesites
```

---

## 📋 Checklist de Testing

Antes de considerar un cambio completo:

- [ ] Los logs no muestran errores
- [ ] El frontend carga en http://localhost:3000
- [ ] El backend responde en http://localhost:4000/health
- [ ] Ollama responde en http://localhost:11434/api/tags
- [ ] La funcionalidad nueva/modificada funciona
- [ ] No hay errores en la consola del navegador
- [ ] Hot reload funciona correctamente

---

## 🔄 Resumen Rápido

| Cambio | Acción Necesaria |
|--------|------------------|
| Código frontend (.tsx, .css) | ✅ Nada (hot reload) |
| Código backend (.ts) | ✅ Nada (hot reload) |
| package.json frontend | 🔄 `docker-compose up -d --build frontend` |
| package.json backend | 🔄 `docker-compose up -d --build backend` |
| Datos en /backend/data | ✅ Nada (se lee en próxima request) |
| Config en /backend/config | ✅ Nada (se lee en próxima request) |
| docker-compose.yml | 🔄 `docker-compose up -d` |
| Dockerfile | 🔄 `docker-compose up -d --build` |
| Cambiar modelo LLM | 🔄 `docker-compose restart backend` |

---

**¡Listo! Con esto tienes todo lo necesario para desarrollar y probar cambios eficientemente.** 🎉
