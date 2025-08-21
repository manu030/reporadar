# Guía de Deployment

## Preparación Pre-Deploy

### 1. Configurar Cuentas Necesarias

**Vercel:**
- Crear cuenta en https://vercel.com
- Conectar repositorio GitHub
- Configurar dominio personalizado (opcional)

**Resend:**
- Crear cuenta en https://resend.com
- Verificar dominio para emails
- Obtener API key

**OpenAI:**
- Crear cuenta en https://platform.openai.com
- Añadir método de pago
- Obtener API key
- Configurar límites de gasto

### 2. Setup Inicial del Proyecto

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/reporadar
cd reporadar

# Instalar dependencias
npm install

# Configurar variables locales
cp .env.example .env.local
```

### 3. Configurar Variables de Entorno

**En .env.local (desarrollo):**
```env
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@reporadar.com
DATABASE_URL=./data/database.sqlite
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CRON_SECRET=local-development-secret
```

**En Vercel (producción):**
1. Ir a tu proyecto en Vercel
2. Settings → Environment Variables
3. Añadir todas las variables (mismo formato)
4. Cambiar `NEXT_PUBLIC_BASE_URL` por tu dominio

### 4. GitHub Secrets (para Actions)

En tu repositorio GitHub:
1. Settings → Secrets and Variables → Actions
2. Añadir secrets:
   - `OPENAI_API_KEY`
   - `RESEND_API_KEY` 
   - `RESEND_FROM_EMAIL`
   - `CRON_SECRET`
   - `VERCEL_TOKEN` (obtener en Vercel Settings)

## Deploy Step by Step

### 1. Deploy Frontend a Vercel

**Opción A: Automático (recomendado)**
```bash
# Push a main branch
git push origin main

# Vercel auto-deploy desde GitHub
```

**Opción B: Manual**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2. Configurar GitHub Action

Crear `.github/workflows/daily-analysis.yml`:
```yaml
name: Daily Repo Analysis

on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC
  workflow_dispatch:

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run daily analysis
        run: node scripts/daily-analysis.js
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_FROM_EMAIL: ${{ secrets.RESEND_FROM_EMAIL }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 3. Inicializar Base de Datos

**Producción (primera vez):**
```bash
# Ejecutar script de inicialización
node scripts/init-db.js
```

La base de datos SQLite se creará automáticamente en el primer deploy.

### 4. Test End-to-End

```bash
# Test local completo
npm run dev

# Test suscripción
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test análisis manual
node scripts/daily-analysis.js

# Test email
node scripts/test-mailer.js
```

## Post-Deploy Checklist

### ✅ Verificaciones Técnicas

- [ ] Frontend carga correctamente en producción
- [ ] Formulario de suscripción funciona
- [ ] Base de datos se crea automáticamente
- [ ] GitHub Action se ejecuta sin errores
- [ ] Emails se envían correctamente
- [ ] API endpoints responden correctamente

### ✅ Configuración de Monitoreo

**Vercel Analytics:**
```bash
# Instalar analytics
npm install @vercel/analytics

# Añadir a _app.js
import { Analytics } from '@vercel/analytics/react'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
```

**Error Tracking Básico:**
```javascript
// lib/logger.js
export const logError = (error, context) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    message: error.message,
    stack: error.stack,
    context
  });
  
  // Opcional: enviar a servicio externo
  // como Sentry, LogRocket, etc.
};
```

### ✅ Testing de Producción

**Test Flujo Completo:**
1. Suscribirse con email real
2. Trigger manual de GitHub Action
3. Verificar que llega email
4. Verificar que aparecen ideas en landing
5. Test unsubscribe

**Test Performance:**
```bash
# Lighthouse CLI
npm install -g lighthouse
lighthouse https://reporadar.vercel.app

# Test de carga
curl -w "@curl-format.txt" -o /dev/null -s https://reporadar.vercel.app
```

## Troubleshooting Deploy

### Errores Comunes

**Error: "Module not found"**
```bash
# Verificar package.json
npm ls
npm install --save missing-package
```

**Error: "Database locked"**
```bash
# Reiniciar base de datos
rm data/database.sqlite
node scripts/init-db.js
```

**Error: "OpenAI API limit"**
```bash
# Verificar límites en OpenAI dashboard
# Añadir error handling en analyzer.js
```

**Error: "GitHub Action fails"**
```bash
# Verificar secrets están configurados
# Check logs en Actions tab
# Test script localmente primero
```

### Rollback Strategy

**Si algo falla:**
```bash
# Vercel rollback automático
vercel rollback

# O deployar versión anterior
git revert HEAD
git push origin main
```

**Base de datos:**
```bash
# Backup automático diario
# Restore desde último backup válido
cp data/database.sqlite.backup data/database.sqlite
```

## Maintenance y Updates

### Updates Regulares
- **Dependencias**: Actualizar monthly
- **Node.js**: Mantener versión LTS
- **OpenAI API**: Monitor cambios de pricing
- **Vercel**: Review analytics y performance

### Scaling Considerations
- **100+ suscriptores**: Todo funciona igual
- **1000+ suscriptores**: Considerar rate limiting
- **10k+ suscriptores**: Migrar a DB externa (PostgreSQL)
- **100k+ suscriptores**: Queue system para emails

### Backup Strategy
```bash
# Daily backup (añadir a cron)
cp data/database.sqlite "backups/db-$(date +%Y%m%d).sqlite"

# Weekly cleanup
find backups/ -name "*.sqlite" -mtime +30 -delete
```

---

*¡Listo para producción!* 🚀