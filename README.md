# RepoRadar 📊

Herramienta automatizada que analiza diariamente los top 5 repositorios trending de GitHub y genera 3 ideas de negocio para cada uno usando IA.

## 🎯 Funcionalidades

- **Análisis Diario**: Scraping automático de GitHub trending
- **IA Integration**: Generación de ideas de negocio con OpenAI
- **Newsletter**: Emails diarios en texto plano 
- **Landing Simple**: Vista de ideas del día anterior
- **Suscripciones**: Sistema básico sin login

## 🏗️ Arquitectura

### Stack Tecnológico
- **Frontend**: Next.js + Tailwind CSS (estilo neobrutalist)
- **Backend**: Node.js + SQLite
- **Email**: Resend API
- **Hosting**: Vercel + GitHub Actions
- **IA**: OpenAI API

### Base de Datos (SQLite)
```sql
-- Suscriptores
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Repositorios procesados
CREATE TABLE processed_repos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_name TEXT NOT NULL,
    repo_url TEXT NOT NULL,
    repo_description TEXT,
    stars INTEGER,
    language TEXT,
    processed_date DATE NOT NULL,
    UNIQUE(repo_name, processed_date)
);

-- Ideas generadas
CREATE TABLE ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id INTEGER NOT NULL,
    idea_number INTEGER NOT NULL, -- 1, 2, or 3
    idea_text TEXT NOT NULL,
    generated_date DATE NOT NULL,
    FOREIGN KEY (repo_id) REFERENCES processed_repos (id)
);
```

## 📂 Estructura del Proyecto

```
RepoRadar/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── .env.local
│
├── pages/
│   ├── index.js              # Landing page
│   ├── success.js            # Confirmación suscripción
│   └── api/
│       ├── subscribe.js      # Endpoint suscripción
│       └── cron/
│           └── daily.js      # Endpoint para GitHub Actions
│
├── lib/
│   ├── database.js           # Funciones SQLite
│   ├── scraper.js           # GitHub trending scraper
│   ├── analyzer.js          # IA analysis
│   ├── mailer.js            # Email sender
│   └── utils.js             # Utilidades varias
│
├── components/
│   ├── SubscribeForm.js     # Formulario suscripción
│   ├── IdeaCard.js          # Card para mostrar ideas
│   └── Layout.js            # Layout principal
│
├── styles/
│   └── globals.css          # Estilos Tailwind
│
├── data/
│   └── database.sqlite      # Base de datos SQLite
│
└── .github/
    └── workflows/
        └── daily-analysis.yml # GitHub Action
```

## 🔧 Variables de Entorno

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Resend Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@reporadar.com

# Database
DATABASE_URL=./data/database.sqlite

# Base URL
NEXT_PUBLIC_BASE_URL=https://reporadar.vercel.app
```

## 🚀 Instalación y Setup

### 1. Clonar y Setup
```bash
git clone https://github.com/tu-usuario/reporadar
cd reporadar
npm install
```

### 2. Configurar Variables
```bash
cp .env.example .env.local
# Editar .env.local con tus API keys
```

### 3. Inicializar Base de Datos
```bash
node scripts/init-db.js
```

### 4. Desarrollo Local
```bash
npm run dev
# http://localhost:3000
```

### 5. Deploy a Vercel
```bash
vercel --prod
```

## 🤖 Automatización Diaria

### GitHub Action (6:00 AM UTC)
```yaml
name: Daily Repo Analysis
on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily
  workflow_dispatch:     # Manual trigger

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: node scripts/daily-analysis.js
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
```

## 📨 Template de Email

```
📊 RepoRadar Daily - 21 de Agosto, 2025

Hoy analizamos estos 5 repositorios trending de GitHub:

🔥 microsoft/terminal
⭐ 94,821 stars | C++
Descripción: The new Windows Terminal and the original Windows console host
💡 Idea 1: SaaS de terminal personalizable para equipos de desarrollo con colaboración en tiempo real
💡 Idea 2: Marketplace de temas y extensiones premium para terminals corporativos  
💡 Idea 3: Servicio de backup y sincronización de configuraciones de terminal entre dispositivos

🔥 openai/whisper
⭐ 89,445 stars | Python
Descripción: Robust Speech Recognition via Large-Scale Weak Supervision
💡 Idea 1: API de transcripción especializada para podcasts con detección automática de speakers
💡 Idea 2: Herramienta de subtitulado automático para creadores de contenido en múltiples idiomas
💡 Idea 3: SaaS de análisis de sentimientos en llamadas de ventas transcrita automáticamente

[... 3 repos más ...]

---
RepoRadar | Cancelar suscripción: https://reporadar.com/unsubscribe?token=xyz
```

## 🎨 Guía de Diseño (Neobrutalist)

### Colores
```css
/* Paleta principal */
--primary: #000000      /* Negro puro */
--secondary: #FFFFFF    /* Blanco puro */
--accent: #FF6B6B      /* Rojo coral */
--warning: #FFE66D     /* Amarillo suave */
--success: #4ECDC4     /* Verde menta */

/* Grises */
--gray-100: #F8F9FA
--gray-200: #E9ECEF
--gray-800: #343A40
```

### Tipografía
```css
/* Fuentes */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Pesos */
font-weight: 400 (Regular)
font-weight: 600 (Semibold) 
font-weight: 800 (Extrabold) /* Para títulos */
```

### Componentes
- **Bordes**: 2-3px grosor, negro sólido
- **Sombras**: box-shadow: 4px 4px 0px #000000
- **Botones**: Rectangulares, sin border-radius
- **Cards**: Fondo blanco, borde negro, sombra offset
- **Inputs**: Border 2px negro, focus con accent color

## 📊 Métricas y Monitoring

### KPIs a Trackear
- Suscriptores totales
- Tasa de apertura de emails
- Repos únicos analizados
- Ideas generadas por día
- Tasa de crecimiento semanal

### Logging Simple
```javascript
// En cada script principal
console.log(`[${new Date().toISOString()}] Starting daily analysis...`);
console.log(`Found ${newRepos.length} new repositories`);
console.log(`Generated ${totalIdeas} ideas`);
console.log(`Sent ${emailsSent} newsletters`);
```

## 🔄 Flujo de Datos Completo

1. **06:00 UTC**: GitHub Action trigger
2. **Scraping**: Obtener top 5 trending repos de https://github.com/trending
3. **Filtrado**: Verificar en DB cuáles no han sido procesados hoy
4. **Análisis IA**: Por cada repo nuevo:
   - Extraer: nombre, descripción, estrellas, lenguaje
   - Prompt a OpenAI: generar 3 ideas de negocio
   - Validar respuesta y parsear
5. **Almacenamiento**: Guardar repos e ideas en SQLite
6. **Email**: Enviar newsletter a todos los suscriptores activos
7. **Frontend**: Auto-deploy actualiza la landing con nuevas ideas

## 🐛 Manejo de Errores

### Errores Comunes
- **GitHub Rate Limit**: Implementar retry con backoff
- **OpenAI API Fail**: Fallback a ideas template
- **Email Delivery**: Log fallos, retry en 1 hora
- **Database Lock**: Implement connection pooling

### Logs de Error
```javascript
// Estructura de logs
{
  timestamp: "2025-08-21T06:00:00Z",
  level: "ERROR",
  service: "scraper|analyzer|mailer",
  message: "Descriptive error message",
  data: { /* relevant context */ }
}
```

## 🚢 Deploy Checklist

- [ ] Configurar variables de entorno en Vercel
- [ ] Setup GitHub Secrets para Actions
- [ ] Inicializar base de datos SQLite
- [ ] Configurar dominio personalizado
- [ ] Testear flujo completo end-to-end
- [ ] Setup monitoring básico
- [ ] Documentar runbook de troubleshooting

## 📞 Soporte y Mantenimiento

### Comandos Útiles
```bash
# Test scraper
node scripts/test-scraper.js

# Test IA analysis
node scripts/test-analyzer.js

# Test email sending
node scripts/test-mailer.js

# Manual daily run
node scripts/daily-analysis.js

# Database queries
sqlite3 data/database.sqlite
```

### Backup Strategy
- **Automated**: Daily SQLite backup to Vercel Blob
- **Manual**: Weekly export de suscriptores
- **Recovery**: Restore desde GitHub releases

---

*Última actualización: Agosto 2025*