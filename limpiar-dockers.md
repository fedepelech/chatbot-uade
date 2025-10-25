# 1. Detener TODOS los contenedores
docker stop $(docker ps -aq)

# 2. Eliminar TODOS los contenedores
docker rm $(docker ps -aq)

# 3. Eliminar TODOS los volúmenes
docker volume rm $(docker volume ls -q)

# 4. Eliminar redes no utilizadas
docker network prune -f

# 5. Opcional: Limpiar imágenes no utilizadas
docker image prune -a -f

# 6. Verificar que todo esté limpio
docker ps -a        # No debe mostrar contenedores
docker volume ls    # No debe mostrar volúmenes
