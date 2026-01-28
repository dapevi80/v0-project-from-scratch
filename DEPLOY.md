# Guia de Despliegue - MeCorrieron.mx

## Arquitectura de Dominios

| Dominio | Proposito | Proyecto Vercel |
|---------|-----------|-----------------|
| `mecorrieron.mx` | Landing/Marketing/SEO | mecorrieron-web |
| `app.mecorrieron.mx` | Aplicacion PWA | mecorrieron-app |

---

## Opcion A: Proyecto Unico (Actual)

Si mantienes un solo proyecto Next.js:

### 1. Crear Proyecto en Vercel

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar repositorio de GitHub
3. Framework: **Next.js**
4. Root Directory: `.` (raiz)

### 2. Configurar Variables de Entorno

En Vercel > Project > Settings > Environment Variables:

```
NEXT_PUBLIC_APP_ENV=prod
NEXT_PUBLIC_APP_NAME=mecorrieron
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Configurar Dominio

En Vercel > Project > Settings > Domains:

1. Agregar `app.mecorrieron.mx`
2. Vercel mostrara los records DNS necesarios

### 4. Configurar DNS en Hostinger

1. Ir a Hostinger > Dominios > mecorrieron.mx > DNS Zone
2. Agregar registro CNAME:
   - Tipo: `CNAME`
   - Nombre: `app`
   - Destino: `cname.vercel-dns.com`
   - TTL: 3600

### 5. Verificar Despliegue

```bash
curl https://app.mecorrieron.mx/health
# Respuesta esperada: {"ok":true,"app":"mecorrieron","env":"prod",...}
```

---

## Opcion B: Dos Proyectos (Recomendado)

Estructura actual con WEB (marketing) separado de APP (aplicacion):

### Estructura Actual

```
/
├── apps/
│   └── web/           # Landing/Marketing (mecorrieron.mx)
│       ├── app/
│       │   ├── page.tsx         # Landing principal
│       │   ├── privacidad/      # Aviso de privacidad
│       │   ├── terminos/        # Terminos y condiciones
│       │   └── abogados/        # Landing para abogados
│       ├── package.json
│       └── next.config.ts
├── app/               # PWA/App (app.mecorrieron.mx) - ROOT
├── components/
├── lib/
└── package.json
```

### Crear 2 Proyectos en Vercel

#### Proyecto 1: mecorrieron-web

1. Vercel > New Project > Importar mismo repo
2. **Root Directory**: `apps/web`
3. Framework: Next.js
4. Environment Variables:
   ```
   NEXT_PUBLIC_APP_ENV=prod
   NEXT_PUBLIC_APP_NAME=web
   ```

#### Proyecto 2: mecorrieron-app

1. Vercel > New Project > Importar mismo repo
2. **Root Directory**: `apps/app`
3. Framework: Next.js
4. Environment Variables:
   ```
   NEXT_PUBLIC_APP_ENV=prod
   NEXT_PUBLIC_APP_NAME=app
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

### DNS en Hostinger

| Tipo | Nombre | Destino |
|------|--------|---------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |
| CNAME | app | cname.vercel-dns.com |

---

## Verificacion de Health

Ambas apps deben responder en `/health`:

```bash
# WEB
curl https://mecorrieron.mx/health
# {"ok":true,"app":"web","env":"prod",...}

# APP
curl https://app.mecorrieron.mx/health
# {"ok":true,"app":"app","env":"prod",...}
```

---

## Troubleshooting

### Error: Variables de entorno faltantes

La app mostrara un componente de "Configuracion Faltante" en lugar de romper el build.
Verifica que todas las variables requeridas estan configuradas en Vercel.

### Error: DNS no propaga

Los cambios de DNS pueden tardar hasta 48 horas. Usa [dnschecker.org](https://dnschecker.org) para verificar propagacion.

### Error: SSL no funciona

Vercel genera certificados SSL automaticamente. Si hay problemas:
1. Verificar que el dominio esta correctamente agregado en Vercel
2. Esperar unos minutos para que Vercel genere el certificado
3. Verificar que no hay conflictos con otros registros DNS

---

## Contacto

Para soporte tecnico: soporte@mecorrieron.mx
