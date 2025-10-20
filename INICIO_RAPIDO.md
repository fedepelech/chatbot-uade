# 🚀 Inicio Rápido - UadeBot

Comandos para levantar y testear la aplicación completa desde cero.

---

## 📋 Pre-requisitos

Verificar que Docker esté instalado y corriendo:

```bash
docker --version
docker-compose --version
```

---

## 🎯 Levantar la Aplicación Completa

### Paso 1: Navegar al directorio del proyecto

```bash
cd /home/federico/Documentos/Facu/chatbot-uade
```

### Paso 2: Levantar todos los contenedores

```bash
docker-compose up -d --build
```

**Qué hace este comando:**
- `up`: Inicia los servicios
- `-d`: Modo detached (en segundo plano)
- `--build`: Construye las imágenes antes de iniciar

**Salida esperada:**
```
[+] Building 45.2s (24/24) FINISHED
[+] Running 4/4
 ✔ Network chatbot-uade_default         Created
 ✔ Container chatbot-uade-ollama-1      Started
 ✔ Container chatbot-uade-backend-1     Started
 ✔ Container chatbot-uade-frontend-1    Started
```

### Paso 3: Verificar que los contenedores estén corriendo

```bash
docker-compose ps
```

**Salida esperada:**
```
NAME                        STATUS              PORTS
chatbot-uade-frontend-1     Up 30 seconds       0.0.0.0:3000->3000/tcp
chatbot-uade-backend-1      Up 30 seconds       0.0.0.0:4000->4000/tcp
chatbot-uade-ollama-1       Up 30 seconds       0.0.0.0:11434->11434/tcp
```

### Paso 4: Ver logs para confirmar que todo inició correctamente

```bash
# Ver logs de todos los servicios
docker-compose logs

# O ver logs en tiempo real
docker-compose logs -f
```

**Presiona Ctrl+C para salir de los logs**

### Paso 5: Descargar el modelo de Ollama (PRIMERA VEZ SOLAMENTE)

**Abrir una nueva terminal** y ejecutar:

```bash
docker exec -it chatbot-uade-ollama-1 ollama pull gemma3:1b
```

**Tiempo estimado:** 2-5 minutos (depende de tu conexión)

**Salida esperada:**
```
pulling manifest
pulling 8eeb52dfb3bb... 100% ▕████████████████▏ 1.5 GB
pulling 097a36493f71... 100% ▕████████████████▏  8.4 KB
pulling 109037bec39c... 100% ▕████████████████▏  136 B
pulling 22f7f7540a20... 100% ▕████████████████▏   59 B
pulling 887433b89a90... 100% ▕████████████████▏  483 B
verifying sha256 digest
writing manifest
success
```

### Paso 6: Verificar que el modelo se descargó

```bash
docker exec -it chatbot-uade-ollama-1 ollama list
```

**Salida esperada:**
```
NAME            ID              SIZE      MODIFIED
gemma3:1b       abc123def456    1.5 GB    2 minutes ago
```

---

## ✅ Testing de la Aplicación

### Test 1: Verificar Frontend

```bash
# Abrir en el navegador
xdg-open http://localhost:3000
# O en Mac: open http://localhost:3000
# O en Windows: start http://localhost:3000
```

**O manualmente:** Abre tu navegador y ve a http://localhost:3000

**Deberías ver:**
- Interfaz del chatbot UadeBot
- Header con "UadeBot"
- Input para escribir mensajes

### Test 2: Verificar Backend (Health Check)

```bash
curl http://localhost:4000/health
```

**Salida esperada:**
```json
{"status":"ok"}
```

### Test 3: Verificar Ollama

```bash
curl http://localhost:11434/api/tags
```

**Salida esperada:**
```json
{"models":[{"name":"gemma3:1b","modified_at":"...","size":1500000000}]}
```

### Test 4: Probar el chatbot end-to-end

1. **Configurar legajo en el navegador:**
   - Abre http://localhost:3000
   - Abre la consola del navegador (F12)
   - Ejecuta:
   ```javascript
   localStorage.setItem('legajo', '123456');
   ```
   - Recarga la página (F5)

2. **Enviar un mensaje de prueba:**
   - Escribe en el chat: "¿Cuánto debo de la cuota?"
   - Presiona Enter o click en "Enviar"

3. **Verificar respuesta:**
   - Deberías ver el indicador "escribiendo..."
   - Luego una respuesta del bot con información de la cuenta

### Test 5: Ver logs en tiempo real durante el test

**En otra terminal:**

```bash
# Ver logs del backend
docker-compose logs -f backend
```

**Deberías ver:**
```
[MCP] Procesando prompt del usuario: "¿Cuánto debo de la cuota?"
[SELECT_TOOL] Usando 9 tools disponibles para selección
[LLM] Tool selection response: {"tool":"get_cuenta_corriente","parameters":{"legajo":"123456"}}
[EXECUTE_TOOL] Ejecutando tool: get_cuenta_corriente
[EXECUTE_TOOL] Tool ejecutada exitosamente: get_cuenta_corriente
```

---

## 🔍 Verificación Completa

### Checklist de Testing:

```bash
# 1. Contenedores corriendo
docker-compose ps
# ✓ Todos deben estar "Up"

# 2. Frontend accesible
curl -I http://localhost:3000
# ✓ Debe retornar HTTP 200

# 3. Backend accesible
curl http://localhost:4000/health
# ✓ Debe retornar {"status":"ok"}

# 4. Ollama accesible
curl http://localhost:11434/api/tags
# ✓ Debe listar el modelo gemma3:1b

# 5. Logs sin errores críticos
docker-compose logs | grep -i error
# ✓ No debe haber errores críticos
```

---

## 📊 Monitoreo en Tiempo Real

### Ver uso de recursos

```bash
docker stats
```

**Salida esperada:**
```
CONTAINER ID   NAME                      CPU %   MEM USAGE / LIMIT
abc123         chatbot-uade-frontend-1   0.5%    50MiB / 8GiB
def456         chatbot-uade-backend-1    2.0%    200MiB / 8GiB
ghi789         chatbot-uade-ollama-1     15.0%   2GiB / 8GiB
```

### Ver logs de un servicio específico

```bash
# Frontend
docker-compose logs -f frontend

# Backend
docker-compose logs -f backend

# Ollama
docker-compose logs -f ollama
```

---

## 🛑 Detener la Aplicación

### Detener todos los contenedores

```bash
docker-compose down
```

**Salida esperada:**
```
[+] Running 4/4
 ✔ Container chatbot-uade-frontend-1   Removed
 ✔ Container chatbot-uade-backend-1    Removed
 ✔ Container chatbot-uade-ollama-1     Removed
 ✔ Network chatbot-uade_default        Removed
```

**Nota:** Esto NO elimina el modelo descargado (se guarda en un volumen)

### Detener y eliminar TODO (incluyendo volúmenes)

```bash
docker-compose down -v
```

**⚠️ CUIDADO:** Esto eliminará el modelo de Ollama y tendrás que descargarlo de nuevo.

---

## 🔄 Reiniciar la Aplicación

### Si ya descargaste el modelo antes:

```bash
# Simplemente levantar los contenedores
docker-compose up -d
```

**No necesitas `--build` si no cambiaste código**

### Ver logs al iniciar

```bash
docker-compose up
```

**Sin `-d` verás los logs en tiempo real**
**Presiona Ctrl+C para detener**

---

## 🐛 Troubleshooting

### Problema: Puerto ya en uso

```bash
# Ver qué proceso usa el puerto 3000
sudo lsof -i :3000

# O cambiar el puerto en docker-compose.yml
# "3001:3000" en lugar de "3000:3000"
```

### Problema: Contenedor no inicia

```bash
# Ver logs del contenedor problemático
docker-compose logs backend

# Reiniciar el contenedor
docker-compose restart backend

# Reconstruir si es necesario
docker-compose up -d --build backend
```

### Problema: Modelo no descarga

```bash
# Verificar espacio en disco
df -h

# Verificar logs de Ollama
docker-compose logs ollama

# Intentar descargar manualmente
docker exec -it chatbot-uade-ollama-1 ollama pull gemma3:1b
```

### Problema: Frontend muestra error de conexión

```bash
# Verificar que el backend esté corriendo
curl http://localhost:4000/health

# Verificar logs del backend
docker-compose logs -f backend

# Reiniciar backend
docker-compose restart backend
```

---

## 📝 Resumen de Comandos Esenciales

```bash
# LEVANTAR TODO
docker-compose up -d --build

# DESCARGAR MODELO (primera vez)
docker exec -it chatbot-uade-ollama-1 ollama pull gemma3:1b

# VER ESTADO
docker-compose ps

# VER LOGS
docker-compose logs -f

# DETENER TODO
docker-compose down

# REINICIAR
docker-compose restart

# LIMPIAR TODO
docker-compose down -v
```

---

## 🎯 Workflow Completo (Copy-Paste)

```bash
# 1. Ir al directorio
cd /home/federico/Documentos/Facu/chatbot-uade

# 2. Levantar contenedores
docker-compose up -d --build

# 3. Esperar 30 segundos
sleep 30

# 4. Descargar modelo (primera vez)
docker exec -it chatbot-uade-ollama-1 ollama pull gemma3:1b

# 5. Verificar que todo esté OK
docker-compose ps
curl http://localhost:4000/health
curl http://localhost:11434/api/tags

# 6. Abrir navegador
echo "Abre http://localhost:3000 en tu navegador"

# 7. Ver logs en tiempo real
docker-compose logs -f
```

---

**¡Listo! Tu aplicación UadeBot está corriendo y lista para probar.** 🎉

**URLs importantes:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Ollama: http://localhost:11434
