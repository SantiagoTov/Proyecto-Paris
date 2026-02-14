# GitHub Management Skill

Este skill detalla el procedimiento para gestionar el repositorio de GitHub de manera eficiente, especialmente cuando existen problemas de autenticación en el entorno local.

## Propósito
Permitir la sincronización continua del código con el repositorio remoto (`SantiagoTov/Proyecto-Paris`) utilizando las herramientas del Protocolo de Contexto del Modelo (MCP), asegurando que los cambios se suban de manera atómica y con mensajes de commit descriptivos.

## Procedimiento de Empuje (Push) mediante MCP

Cuando el comando `git push` falla localmente o se requiere un empuje directo desde el asistente:

1. **Identificación de Cambios**: Verificar qué archivos han sido modificados o creados.
2. **Lectura de Contenido**: Obtener el contenido completo y actualizado de cada archivo afectado.
3. **Uso de `push_files`**:
    - Agrupar todos los archivos en un único llamado a `mcp_github-mcp-server_push_files`.
    - Especificar la rama (generalmente `main`).
    - Redactar un mensaje de commit que resuma las funcionalidades implementadas.

## Mejores Prácticas

- **Commit Atómicos**: Agrupar cambios relacionados (ej: toda la lógica de notificaciones) en un solo push.
- **Mensajes en Español**: Dado que el usuario prefiere el español, los mensajes de commit y la documentación deben seguir este estándar para facilitar su revisión.
- **Validación Post-Push**: Confirmar que los archivos se crearon correctamente en el remoto revisando la respuesta del servidor MCP.

## Referencia de Archivos Clave
- `src/components/`: Componentes globales del sistema.
- `src/pages/`: Vistas principales.
- `lib/supabaseClient.ts`: Conexión con la base de datos.
