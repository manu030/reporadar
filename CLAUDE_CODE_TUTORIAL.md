# 🤖 Tutorial Completo: Construyendo RepoRadar con Claude Code

## Introducción: ¿Qué es Claude Code?

Claude Code es una herramienta de desarrollo asistido por IA que actúa como un copiloto inteligente. No es solo un generador de código, sino un asistente que entiende contexto, arquitectura, y puede ejecutar tareas complejas de principio a fin.

### Capacidades Clave de Claude Code:
- **Comprensión contextual**: Entiende tu proyecto completo
- **Ejecución autónoma**: Puede crear, editar, y refactorizar código
- **Testing integrado**: Ejecuta y depura código automáticamente
- **Arquitectura inteligente**: Sugiere patrones y mejores prácticas

---

## 📋 Pre-requisitos

### Software Necesario
```bash
# 1. Node.js (v18 o superior)
node --version

# 2. Git
git --version

# 3. Editor de código (VS Code recomendado)
code --version

# 4. Claude Code CLI
npm install -g @anthropic/claude-code
```

### Cuentas y API Keys
- GitHub (para el repositorio)
- OpenAI (para generar ideas)
- Resend (para enviar emails)
- Vercel (para hosting)

---

## 🚀 Proceso Paso a Paso con Claude Code

### PASO 1: Inicialización del Proyecto

#### 1.1 Crear directorio y abrir Claude Code
```bash
mkdir RepoRadar
cd RepoRadar
claude code .
```

#### 1.2 Primer Prompt - Arquitectura General
```
PROMPT #1:
"Quiero crear RepoRadar, una aplicación web que:
1. Scrape los 5 repos más trending de GitHub cada día
2. Use OpenAI para generar 3 ideas de negocio por cada repo
3. Guarde todo en una base de datos SQLite
4. Envíe un newsletter diario con las 15 ideas
5. Tenga una landing page para que la gente se suscriba

Usa Next.js, diseño neobrutalist con Tailwind, y mantenlo simple.
Empieza creando la estructura del proyecto y el package.json"
```

**Respuesta de Claude Code:**
- Crea estructura de carpetas
- Genera package.json con dependencias
- Configura next.config.js
- Crea tailwind.config.js con paleta neobrutalist

#### 1.3 Instalación de Dependencias
```bash
# Claude ejecutará automáticamente:
npm install
```

---

### PASO 2: Implementando el Scraper de GitHub

#### 2.1 Prompt para el Scraper
```
PROMPT #2:
"Crea un scraper en lib/scraper.js que:
1. Vaya a https://github.com/trending?since=daily
2. Extraiga los top 5 repos con: nombre, URL, descripción, stars, lenguaje
3. Use cheerio para parsear HTML
4. Tenga manejo de errores y fallback a datos mock en desarrollo
5. Incluye un script de prueba en scripts/test-scraper.js"
```

**Claude Code genera:**
```javascript
// lib/scraper.js
const cheerio = require('cheerio');

async function scrapeGitHubTrending() {
  try {
    const response = await fetch('https://github.com/trending?since=daily');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const repos = [];
    $('article.Box-row').each((index, element) => {
      if (index >= 5) return false;
      
      const $elem = $(element);
      const repo = {
        name: $elem.find('h2 a').text().trim().replace(/\s+/g, ' '),
        url: 'https://github.com' + $elem.find('h2 a').attr('href'),
        description: $elem.find('p.col-9').text().trim(),
        stars: $elem.find('[aria-label*="star"]').text().trim(),
        language: $elem.find('[itemprop="programmingLanguage"]').text().trim()
      };
      
      if (repo.name) repos.push(repo);
    });
    
    return repos;
  } catch (error) {
    console.error('Error scraping GitHub:', error);
    if (process.env.NODE_ENV === 'development') {
      return getMockRepos();
    }
    throw error;
  }
}

function getMockRepos() {
  return [
    {
      name: 'facebook/react',
      url: 'https://github.com/facebook/react',
      description: 'A declarative, efficient, and flexible JavaScript library',
      stars: '200k',
      language: 'JavaScript'
    }
    // ... más repos mock
  ];
}
```

#### 2.2 Testing del Scraper
```bash
# Claude ejecuta:
npm run test-scraper
```

---

### PASO 3: Base de Datos con SQLite

#### 3.1 Prompt para Database
```
PROMPT #3:
"Crea lib/database.js con una clase Database que:
1. Use SQLite con sqlite3
2. Auto-cree el directorio data/ si no existe
3. Tenga el schema:
   - users (id, email, locale, created_at)
   - processed_repos (id, repo_name, repo_url, description, stars, language, processed_date)
   - ideas (id, repo_id, idea_number, idea_oneliner, idea_problem, idea_solution, idea_business_model, idea_difficulty, generated_date)
4. Métodos: addUser, getUsers, addProcessedRepo, addIdeas, getLatestIdeas
5. Crea también scripts/init-db.js para inicializar la BD"
```

**Claude Code genera:**
```javascript
// lib/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.ensureDataDirectory();
    this.db = new sqlite3.Database(path.join(__dirname, '../data/database.sqlite'));
    this.initialize();
  }
  
  ensureDataDirectory() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
  
  initialize() {
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        locale TEXT DEFAULT 'es',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS processed_repos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_name TEXT NOT NULL,
        repo_url TEXT NOT NULL,
        description TEXT,
        stars TEXT,
        language TEXT,
        processed_date DATE NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS ideas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_id INTEGER NOT NULL,
        idea_number INTEGER NOT NULL,
        idea_oneliner TEXT NOT NULL,
        idea_problem TEXT NOT NULL,
        idea_solution TEXT NOT NULL,
        idea_business_model TEXT NOT NULL,
        idea_difficulty TEXT NOT NULL,
        generated_date DATE NOT NULL,
        FOREIGN KEY (repo_id) REFERENCES processed_repos(id)
      );
    `;
    
    this.db.exec(schema);
  }
  
  async addUser(email, locale = 'es') {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR IGNORE INTO users (email, locale) VALUES (?, ?)',
        [email, locale],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }
  
  // ... más métodos
}
```

---

### PASO 4: Integración con OpenAI

#### 4.1 Prompt para Analyzer
```
PROMPT #4:
"Crea lib/analyzer.js que:
1. Use OpenAI API para generar ideas de negocio
2. Para cada repo, genere 3 ideas con estructura:
   - idea_oneliner: descripción breve
   - idea_problem: problema que resuelve
   - idea_solution: solución propuesta
   - idea_business_model: modelo de negocio
   - idea_difficulty: Fácil/Medio/Difícil
3. Use GPT-4o-mini por defecto, con fallback a GPT-3.5
4. Retorne JSON estructurado
5. Tenga ideas template de fallback si la API falla"
```

**Claude Code genera:**
```javascript
// lib/analyzer.js
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `
Eres un experto en identificar oportunidades de negocio basadas en tecnología.
Analiza el repositorio de GitHub proporcionado y genera EXACTAMENTE 3 ideas de negocio.

Cada idea debe ser:
- Práctica y realizable
- Basada en la tecnología del repositorio
- Con un modelo de negocio claro
- De diferente nivel de dificultad

Responde SOLO con un JSON válido con esta estructura:
{
  "ideas": [
    {
      "idea_oneliner": "Descripción breve de la idea",
      "idea_problem": "Problema específico que resuelve",
      "idea_solution": "Cómo lo resuelve usando esta tecnología",
      "idea_business_model": "Cómo genera ingresos",
      "idea_difficulty": "Fácil|Medio|Difícil"
    }
  ]
}
`;

async function generateBusinessIdeas(repo) {
  const userPrompt = `
    Repositorio: ${repo.name}
    URL: ${repo.url}
    Descripción: ${repo.description}
    Lenguaje: ${repo.language}
    Stars: ${repo.stars}
    
    Genera 3 ideas de negocio innovadoras basadas en este repositorio.
  `;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 1500
    });
    
    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback a GPT-3.5
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8
      });
      
      return JSON.parse(completion.choices[0].message.content);
    } catch (fallbackError) {
      console.error('Fallback también falló:', fallbackError);
      return getTemplateIdeas(repo);
    }
  }
}

function getTemplateIdeas(repo) {
  // Ideas de plantilla como último recurso
  return {
    ideas: [
      {
        idea_oneliner: `Plataforma SaaS basada en ${repo.name}`,
        idea_problem: "Las empresas necesitan soluciones personalizadas",
        idea_solution: `Usar ${repo.name} para crear una solución lista para usar`,
        idea_business_model: "Suscripción mensual $49-$299",
        idea_difficulty: "Medio"
      },
      // ... más ideas template
    ]
  };
}
```

---

### PASO 5: Sistema de Email

#### 5.1 Prompt para Mailer
```
PROMPT #5:
"Crea lib/mailer.js que:
1. Use Resend API para enviar emails
2. Soporte newsletters en español e inglés
3. Envíe emails en texto plano (no HTML)
4. Tenga un template limpio y profesional
5. Incluya link de unsubscribe
6. Maneje errores sin detener el batch
7. Respete rate limits"
```

**Claude Code genera el sistema de email completo**

---

### PASO 6: Landing Page con Next.js

#### 6.1 Prompt para la Landing
```
PROMPT #6:
"Crea pages/index.js con:
1. Hero section con título llamativo y formulario de suscripción
2. Grid de las últimas 15 ideas generadas
3. Diseño neobrutalist: bordes gruesos, sombras duras, colores vibrantes
4. Responsive design
5. Componentes IdeaCard, SubscribeForm, Layout
6. Fetch de ideas desde /api/ideas/latest"
```

**Claude Code genera toda la UI**

---

### PASO 7: API Endpoints

#### 7.1 Prompt para APIs
```
PROMPT #7:
"Crea los siguientes endpoints en pages/api/:
1. /api/subscribe - POST para suscribir usuarios
2. /api/unsubscribe - GET con token para desuscribir
3. /api/ideas/latest - GET las últimas 15 ideas
4. /api/cron/daily - Proceso diario (scraping + análisis + email)
5. /api/stats - GET estadísticas básicas
Todos con manejo de errores apropiado"
```

---

### PASO 8: Internacionalización

#### 8.1 Prompt para i18n
```
PROMPT #8:
"Añade soporte para español e inglés:
1. Hook useTranslations en hooks/useTranslations.js
2. Componente LanguageSelector
3. Rutas /es y /en
4. APIs separadas para cada idioma
5. Newsletters en ambos idiomas
6. Guarda el locale en la BD"
```

---

### PASO 9: Testing Completo

#### 9.1 Prompt para Testing
```
PROMPT #9:
"Crea scripts de testing en scripts/:
1. test-scraper.js - Prueba el scraping
2. test-analyzer.js - Prueba generación de ideas
3. test-mailer.js - Prueba envío de emails
4. daily-analysis.js - Ejecuta el ciclo completo
Añade los comandos correspondientes en package.json"
```

#### 9.2 Ejecutar Tests
```bash
# Claude ejecutará cada test:
npm run test-scraper
npm run test-analyzer
npm run test-mailer
npm run daily-analysis
```

---

### PASO 10: Deployment a Producción

#### 10.1 Prompt para Deployment
```
PROMPT #10:
"Prepara el proyecto para deployment en Vercel:
1. Crea vercel.json con configuración de cron jobs
2. Añade .env.example con todas las variables necesarias
3. Actualiza README con instrucciones de deployment
4. Configura GitHub Actions para CI/CD
5. Optimiza para producción"
```

#### 10.2 Configuración de Vercel
```json
// vercel.json generado por Claude
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 6 * * *"
    }
  ],
  "functions": {
    "pages/api/cron/daily.js": {
      "maxDuration": 60
    }
  }
}
```

#### 10.3 Deploy
```bash
# Claude te guiará:
vercel --prod
```

---

## 🎯 Trucos y Tips para Usar Claude Code Efectivamente

### 1. Prompts Estructurados
```
ESTRUCTURA IDEAL:
1. Contexto: "Tengo una app Next.js con..."
2. Objetivo: "Quiero añadir..."
3. Requisitos específicos: "Debe tener..."
4. Constrains: "Evita usar..."
5. Output esperado: "Genera el archivo..."
```

### 2. Desarrollo Iterativo
```
❌ MAL: "Crea una aplicación completa de e-commerce"
✅ BIEN: "Crea el modelo de datos para productos" → "Ahora las APIs" → "Ahora la UI"
```

### 3. Debugging con Claude
```
PROMPT EFECTIVO:
"Tengo este error: [error]
En este código: [código]
Ya intenté: [intentos previos]
¿Cuál puede ser la causa?"
```

### 4. Refactoring Inteligente
```
"Refactoriza este código para:
1. Mejorar legibilidad
2. Reducir complejidad
3. Añadir tipos TypeScript
4. Seguir principios SOLID"
```

### 5. Optimización de Performance
```
"Analiza este componente y sugiere optimizaciones:
1. Memoización
2. Lazy loading
3. Code splitting
4. Caching strategies"
```

---

## 📊 Comparación: Con vs Sin Claude Code

| Tarea | Sin Claude Code | Con Claude Code | Mejora |
|-------|----------------|-----------------|--------|
| Setup inicial | 2-3 horas | 15 minutos | 12x |
| Scraper | 1-2 horas | 10 minutos | 8x |
| Integración OpenAI | 2-3 horas | 20 minutos | 8x |
| Landing page | 3-4 horas | 30 minutos | 7x |
| i18n | 2 horas | 15 minutos | 8x |
| Testing | 2 horas | 20 minutos | 6x |
| Deployment | 1 hora | 10 minutos | 6x |
| **TOTAL** | **13-18 horas** | **2 horas** | **8x** |

---

## 🚨 Errores Comunes y Soluciones

### Error 1: Claude genera código incompleto
**Solución**: Pide explícitamente "genera el archivo completo"

### Error 2: Dependencias faltantes
**Solución**: Siempre pide "actualiza package.json con las dependencias necesarias"

### Error 3: Código no sigue convenciones
**Solución**: Especifica el estilo al inicio: "Usa async/await, no callbacks"

### Error 4: Tests fallan
**Solución**: Pide "ejecuta el test y corrige cualquier error"

### Error 5: Performance issues
**Solución**: "Analiza y optimiza este código para producción"

---

## 🎓 Casos de Uso Avanzados

### 1. Migración de Stack
```
"Tengo este código en Express.
Migralo a Next.js manteniendo la funcionalidad"
```

### 2. Generación de Documentación
```
"Analiza este proyecto y genera:
1. README completo
2. Documentación API
3. Guía de contribución"
```

### 3. Implementación de Patrones
```
"Implementa el patrón Repository para
el acceso a datos, separando lógica de negocio"
```

### 4. Security Audit
```
"Revisa este código por vulnerabilidades:
1. SQL injection
2. XSS
3. CSRF
4. Sugiere fixes"
```

---

## 🔮 El Futuro del Desarrollo con IA

### Lo que Claude Code hace HOY:
- Genera código production-ready
- Entiende contexto complejo
- Ejecuta y debuggea
- Sugiere mejoras arquitectónicas

### Lo que viene:
- Agentes autónomos que completan PRs
- Testing automático con edge cases
- Refactoring proactivo
- Optimización continua de performance

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [Claude Code Docs](https://docs.anthropic.com/claude-code)
- [API Reference](https://docs.anthropic.com/api)
- [Best Practices](https://docs.anthropic.com/best-practices)

### Comunidad
- [Discord de Claude Code](https://discord.gg/claude-code)
- [GitHub Discussions](https://github.com/anthropic/claude-code/discussions)
- [Stack Overflow Tag](https://stackoverflow.com/questions/tagged/claude-code)

### Cursos y Tutoriales
- [YouTube: Claude Code Masterclass](https://youtube.com/...)
- [Udemy: AI-Assisted Development](https://udemy.com/...)
- [Blog: Case Studies](https://blog.anthropic.com)

---

## 🏁 Conclusión

Claude Code no es solo una herramienta, es un cambio de paradigma en cómo desarrollamos software. No reemplaza a los desarrolladores, los potencia.

**Principios clave:**
1. **Claridad > Complejidad**: Prompts claros dan mejores resultados
2. **Iteración > Perfección**: Construye incrementalmente
3. **Verificación > Confianza**: Siempre testea el código generado
4. **Contexto > Código**: Claude entiende el "por qué", no solo el "cómo"

**El resultado:** 
- 10x más velocidad
- Menos bugs
- Mejor arquitectura
- Más tiempo para creatividad

---

*"El futuro no es que las máquinas programen por nosotros,
es que programemos CON las máquinas."*

---

**¿Preguntas?** Únete a la conversación en [Twitter](https://twitter.com/...) con #ClaudeCode

*Última actualización: Agosto 2024*