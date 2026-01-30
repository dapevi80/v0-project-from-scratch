# Prompt para v0: Detalle de Caso (Portal de Abogado)

Crea una pantalla de “Detalle de Caso” para el portal de herramientas de abogado. Debe quedar claro que esto es un **caso** (no un lead) y mostrar un **resumen completo** del caso.

## Layout (2 columnas)

### Columna izquierda (principal)
1) **Resumen del caso** en tarjeta grande:
   - Folio del caso
   - Proceso actual (chip/etiqueta)
   - Tipo de caso (laboral, conciliación, etc.)
   - Estado (nuevo / en revisión / asignado / verificado)
   - Fecha de creación

2) **Sección “Cálculo asociado”**
   - Resumen del cálculo (monto estimado, conceptos, fecha)
   - Botón “Ver cálculo completo”

3) **Sección “Documentos subidos”**
   - Lista de archivos (nombre, fecha, tipo, tamaño)
   - Botón “Abrir” o “Descargar”
   - Si no hay documentos, mostrar estado vacío

4) **Timeline/Proceso actual**
   - Pasos del proceso (creado → asignado → perfil verificado → listo para solicitud CCL)
   - Paso actual resaltado

### Columna derecha (secundaria)
1) **Abogado asignado** (avatar, nombre, correo, teléfono)
2) **Cliente/Trabajador**
   - Si no está asignado: mensaje “Sin trabajador asignado”
   - Botón “Asignar a trabajador” (solo para casos manuales)
   - Link para enviar invitación (crear cuenta o iniciar sesión)

3) **Acciones rápidas**
   - “Generar solicitud CCL con IA”
   - “Ver manual de llenado CCL”
   - “Enviar mensaje al cliente”

## Requisitos visuales
- Estilo moderno y limpio, coherente con un dashboard profesional.
- Diferenciar **Lead vs Caso** con un badge visible arriba del título (“Caso” en verde, “Lead” en gris).
- UI responsive.
- Incluir estados vacíos con textos claros.
