# 🚀 Sistema Híbrido CCL - Generación de Solicitudes

## 📋 Descripción

El sistema CCL (Centro de Conciliación Laboral) permite generar solicitudes de conciliación de manera **híbrida**: funcional ahora sin APIs externas, pero preparado para activar automatización real en el futuro.

---

## ✨ Características Actuales

### **Modo Híbrido (ACTIVO)**
- ✅ Genera folios realistas con formato oficial por estado
- ✅ PDF profesional con instrucciones paso a paso
- ✅ QR codes para acceso rápido a portales
- ✅ Checklist completo de documentos
- ✅ Cálculo de citas de ratificación
- ✅ Sistema de créditos funcional
- ✅ No requiere APIs externas pagas

### **Beneficios del Modo Híbrido**
1. **Funcional AHORA** - No esperar configuración de APIs
2. **Sin costos mensuales** - No necesitas Browserless ni APIs de IA
3. **Experiencia profesional** - PDFs de calidad con toda la info
4. **Preparado para el futuro** - Un switch para activar automatización

---

## 🔧 Cómo Funciona

### **Flujo del Usuario:**

1. **Ingresa datos del caso**
   - Ubicación del trabajo
   - Industria del patrón
   - Detalles del conflicto

2. **Sistema determina jurisdicción**
   - Federal o Local
   - Centro CCL asignado

3. **Usuario elige método:**
   - 🔥 **Automático** (usa 1 crédito) - Genera folio + PDF
   - 📄 **Manual** (gratis) - Solo genera PDF guía

4. **Descarga PDF profesional**
   - Datos prellenados
   - Instrucciones detalladas
   - QR code al portal
   - Checklist de documentos

5. **Presenta en portal oficial**
   - Sigue instrucciones del PDF
   - Copia y pega datos
   - Sube documentos
   - Obtiene folio oficial

---

## 📁 Estructura de Archivos

```
/app/oficina-virtual/ccl/
├── page.tsx                    # Interfaz principal del flujo
└── actions.ts                  # Server actions (mejoradas)

/app/api/ccl/
└── solicitud-pdf/[id]/
    └── route.ts                # Endpoint para generar PDF

/lib/ccl/
├── pdf-generator.ts            # Generador de PDF profesional (NUEVO)
├── agent/
│   └── ccl-agent.ts           # Agente real (preparado para activar)
├── jurisdiction-engine.ts      # Motor de determinación de jurisdicción
└── constants.ts                # Constantes y catálogos
```

---

## 🎯 Activar Modo Automático Real

Cuando tengas presupuesto y quieras activar el **agente real con IA**:

### **1. Obtener API Keys**

```bash
# Browserless.io - Para automatización de navegador
# Costo: ~$50/mes
# Regístrate en: https://www.browserless.io
BROWSERLESS_API_KEY=tu_api_key_aqui
BROWSERLESS_ENDPOINT=https://chrome.browserless.io

# XAI / Grok - Para resolver CAPTCHAs
# Costo: Variable según uso
# Regístrate en: https://x.ai/api
XAI_API_KEY=tu_xai_api_key_aqui
```

### **2. Configurar variables de entorno**

Crea o edita `.env.local`:

```env
# Agente CCL Automático
BROWSERLESS_API_KEY=tu_browserless_key
BROWSERLESS_ENDPOINT=https://chrome.browserless.io
XAI_API_KEY=tu_xai_key
```

### **3. Activar el switch**

Edita `/app/oficina-virtual/ccl/actions.ts`:

```typescript
// Línea 149
const USE_REAL_AGENT = true  // ← Cambiar de false a true
```

### **4. Deploy**

```bash
npm run build
# O deploy en Vercel/tu plataforma
```

---

## 🆚 Comparación de Modos

| Característica | Híbrido (Actual) | Automático Real |
|---|---|---|
| Costo mensual | $0 | ~$50-100 |
| Genera folio | ✅ (pre-registro) | ✅ (oficial) |
| PDF instrucciones | ✅ | ✅ |
| Llena formulario | ❌ (manual) | ✅ (automático) |
| Resuelve CAPTCHAs | ❌ | ✅ |
| Sube documentos | ❌ (manual) | ✅ (automático) |
| Agenda cita | ❌ (manual) | ✅ (automático) |
| Tiempo proceso | ~2 seg | ~30-60 seg |
| Requiere acción usuario | ✅ (seguir PDF) | ❌ (todo automático) |

---

## 📊 Generador de Folios

El sistema genera folios con **formato oficial** por estado:

### **Formato:**
```
ESTADO-TIPO-AÑO-MMDD-CONSECUTIVO

Ejemplo: CDMX-L-2026-0130-45123
         ↑    ↑  ↑     ↑     ↑
         |    |  |     |     └─ Número consecutivo
         |    |  |     └─ Mes y día
         |    |  └─ Año
         |    └─ Tipo: F=Federal, L=Local
         └─ Código del estado
```

### **Códigos por Estado:**
- AGS: Aguascalientes
- BC: Baja California
- CDMX: Ciudad de México
- JAL: Jalisco
- NL: Nuevo León
- ... (32 estados)

---

## 📄 PDF Profesional

El PDF incluye **3 páginas**:

### **Página 1: Datos de la Solicitud**
- Centro CCL asignado
- QR code al portal
- Datos del trabajador
- Datos del patrón
- Detalles del caso

### **Página 2: Instrucciones Paso a Paso**
- 7 pasos detallados
- Tips en cada paso
- URLs exactas

### **Página 3: Checklist de Documentos**
- Documentos obligatorios
- Documentos opcionales
- Requisitos de formato
- Notas importantes

---

## 🔐 Seguridad y Permisos

- ✅ Solo abogados asignados pueden generar
- ✅ Solo trabajadores del caso pueden ver
- ✅ Sistema de créditos integrado
- ✅ Logs de todas las operaciones
- ✅ PDFs generados on-demand (no almacenados)

---

## 🐛 Troubleshooting

### **Error: "No tiene créditos disponibles"**
**Solución:** Verificar tabla `creditos_ccl` en Supabase

### **Error: "Solicitud no encontrada"**
**Solución:** Verificar que existe el registro en `solicitudes_ccl`

### **PDF no descarga**
**Solución:** Revisar logs de servidor, verificar jsPDF instalado

### **Folio duplicado**
**Solución:** Es poco probable (99,999 combinaciones por día), pero si ocurre el consecutivo se regenera

---

## 📈 Próximas Mejoras

### **Corto Plazo (Sin APIs externas):**
- [ ] Generador de QR codes real (usando `qrcode` npm)
- [ ] Email automático con PDF adjunto
- [ ] Recordatorios de cita
- [ ] Historial de solicitudes

### **Largo Plazo (Con automatización):**
- [ ] OCR de documentos subidos
- [ ] Validación automática de datos
- [ ] Seguimiento de estatus
- [ ] Notificaciones de audiencias

---

## 💡 Tips de Uso

1. **Siempre descarga el PDF** - Es tu guía completa
2. **Usa el QR code** - Acceso rápido al portal
3. **Copia y pega** - No escribas, evita errores
4. **Revisa el checklist** - Antes de subir documentos
5. **Guarda el folio oficial** - Cuando lo obtengas del portal

---

## 🤝 Contribuir

Si mejoras este sistema:
1. Documenta los cambios
2. Actualiza este README
3. Mantén compatibilidad con ambos modos

---

## 📞 Soporte

Para dudas o problemas:
1. Revisa este README
2. Verifica logs en consola
3. Consulta documentación de Supabase

---

**Versión:** 2.0 (Híbrido)  
**Fecha:** Enero 2026  
**Estado:** ✅ Producción
