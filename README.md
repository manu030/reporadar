# 👻 Repo Radar

**AI-Powered GitHub Trending Analysis & Business Idea Generator**

Repo Radar automatically analyzes GitHub's trending repositories and generates detailed business ideas using AI. Features multilingual support (Spanish/English), automated newsletters, and runs on a Monday/Wednesday/Saturday schedule.

## 🎯 Key Features

- **🤖 AI-Powered Analysis**: Detailed business idea generation using OpenAI GPT-4
- **🌍 Multilingual Support**: Full Spanish and English localization
- **📧 Smart Newsletters**: Automated multilingual email campaigns via Resend
- **⏰ Scheduled Analysis**: Monday/Wednesday/Saturday at 4 AM UTC
- **📊 Comprehensive Ideas**: Each repository generates 3 detailed business concepts with problem/solution/business model
- **🎨 Modern UI**: Neobrutalist design with responsive layout and custom logo
- **📱 Mobile-First**: Optimized experience across all devices

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 with App Router + Tailwind CSS (Neobrutalist design)
- **Backend**: Node.js serverless functions + SQLite
- **Email**: Resend API with multilingual templates
- **AI**: OpenAI GPT-4o-mini with fallback systems
- **Deployment**: Vercel with automated GitHub Actions
- **Scheduling**: GitHub Actions (Mon/Wed/Sat 4 AM UTC) + Vercel Cron
- **Fonts**: Custom Oi font for branding

### Database Schema (SQLite)
```sql
-- Multilingual subscribers
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    locale TEXT DEFAULT 'es',
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

-- Detailed business ideas
CREATE TABLE ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id INTEGER NOT NULL,
    idea_number INTEGER NOT NULL,
    idea_oneliner TEXT NOT NULL,
    idea_problem TEXT NOT NULL,
    idea_solution TEXT NOT NULL,
    idea_business_model TEXT NOT NULL,
    idea_difficulty TEXT NOT NULL,
    generated_date DATE NOT NULL,
    FOREIGN KEY (repo_id) REFERENCES processed_repos (id)
);
```

## 📂 Estructura del Proyecto

```
Repo Radar/
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
│   ├── database.js           # SQLite operations with i18n support
│   ├── scraper.js           # GitHub trending scraper with fallbacks
│   ├── analyzer.js          # OpenAI analysis with detailed prompts
│   └── mailer.js            # Multilingual email system
│
├── components/
│   ├── SubscribeForm.js     # Multilingual subscription form
│   ├── IdeaCard.js          # Detailed idea display cards
│   ├── LanguageSelector.js  # Spanish/English toggle
│   └── Layout.js            # Responsive layout with i18n
│
├── hooks/
│   └── useTranslations.js   # Translation hook for both languages
│
├── public/
│   └── reporadar_logo.png   # Custom ghost logo (6rem x 6rem)
│
├── styles/
│   └── globals.css          # Estilos Tailwind
│
├── data/
│   └── database.sqlite      # Base de datos SQLite
│
├── scripts/
│   ├── daily-analysis.js    # Main automation script
│   ├── init-db.js          # Database initialization
│   ├── test-analyzer.js    # AI testing utilities
│   ├── test-mailer.js      # Email testing utilities
│   └── test-scraper.js     # Scraper testing utilities
│
└── .github/
    └── workflows/
        └── daily-analysis.yml # Mon/Wed/Sat 4AM UTC schedule
```

## 🔧 Environment Variables

```env
# OpenAI API (required for AI analysis)
OPENAI_API_KEY=sk-proj-...

# Resend Email API (required for newsletters)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@reporadar.com

# Application URL (required for email links)
NEXT_PUBLIC_BASE_URL=https://reporadar.vercel.app

# Optional: Database path (defaults to ./data/database.sqlite)
DATABASE_URL=./data/database.sqlite
```

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/manu030/reporadar.git
cd reporadar
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your API keys:
# - OPENAI_API_KEY (from OpenAI)
# - RESEND_API_KEY (from Resend)
# - RESEND_FROM_EMAIL (your verified sender email)
```

### 3. Initialize Database
```bash
npm run init-db
```

### 4. Start Development
```bash
npm run dev
# Opens on http://localhost:3001
# Available in both Spanish (/) and English (/en)
```

### 5. Test the System
```bash
# Test GitHub scraping
npm run test-scraper

# Test AI analysis
npm run test-analyzer

# Test email system
npm run test-mailer

# Run full analysis pipeline
npm run daily-analysis
```

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on every push to main
4. Vercel cron jobs handle the Mon/Wed/Sat schedule

### Manual Deployment
```bash
vercel --prod
```

## 🤖 Automated Scheduling

### GitHub Actions (Monday/Wednesday/Saturday 4 AM UTC)
```yaml
name: Daily Repository Analysis

on:
  schedule:
    # Monday, Wednesday, Saturday at 4:00 AM UTC (5 AM CET)
    - cron: '0 4 * * 1,3,6'
  workflow_dispatch: # Allow manual trigger

jobs:
  analyze-and-send:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Initialize database
        run: npm run init-db
      - name: Run daily analysis
        run: npm run daily-analysis
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_FROM_EMAIL: ${{ secrets.RESEND_FROM_EMAIL }}
          NEXT_PUBLIC_BASE_URL: ${{ secrets.NEXT_PUBLIC_BASE_URL }}
```

## 📨 Email Newsletter Format

### Detailed Business Ideas Structure
Each repository generates 3 comprehensive business ideas with:
- **One-liner**: Concise business description (max 80 chars)
- **Problem**: Clear problem identification (2-3 sentences)
- **Solution**: Detailed solution explanation (3-4 sentences)  
- **Business Model**: Specific revenue generation strategy (2-3 sentences)
- **Difficulty**: Implementation complexity assessment (Easy/Medium/Hard)

### Multilingual Templates
- **Spanish newsletters** for Spanish subscribers (`locale: 'es'`)
- **English newsletters** for English subscribers (`locale: 'en'`)
- Automatic language detection based on user preference
- Consistent branding and formatting across languages

## 🎨 Design System (Neobrutalist)

### Color Palette
```css
/* Updated high-contrast colors */
--primary: #222222      /* Dark primary (improved contrast) */
--secondary: #FFFFFF    /* Pure white background */
--accent: #DC2626      /* Strong red accent */
--warning: #D97706     /* Strong orange warning */
--success: #059669     /* Strong green success */
--gray-text: #374151   /* Readable gray text */
```

### Typography
```css
/* Main font family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Brand title font (custom) */
font-family: 'Rowdies', cursive; /* Used for main RepoRadar title - expressive & loud */

/* Font weights */
font-weight: 400 (Regular)
font-weight: 600 (Semibold) 
font-weight: 800 (Extrabold) /* For headings */
```

### UI Components
- **Logo**: 6rem x 6rem ghost mascot with compass
- **Borders**: 2-3px solid black borders throughout
- **Shadows**: `box-shadow: 4px 4px 0px #000000` (brutal offset)
- **Buttons**: Rectangular, no border-radius, bold styling
- **Cards**: White background, black border, offset shadow
- **Inputs**: 2px black border, accent color on focus
- **Language Selector**: Black border for visibility
- **Difficulty Badges**: Color-coded with strong backgrounds

## 📊 Analytics & Monitoring

### Key Metrics
- **Total Subscribers**: Spanish vs English breakdown
- **Email Performance**: Open rates, delivery success
- **Repository Analysis**: Unique repos processed, trending accuracy
- **AI Performance**: Idea generation success rate, fallback usage
- **User Growth**: Weekly acquisition, language preferences

### Logging Simple
```javascript
// En cada script principal
console.log(`[${new Date().toISOString()}] Starting daily analysis...`);
console.log(`Found ${newRepos.length} new repositories`);
console.log(`Generated ${totalIdeas} ideas`);
console.log(`Sent ${emailsSent} newsletters`);
```

## 🔄 Complete Data Flow

### Automated Pipeline (Mon/Wed/Sat 4:00 AM UTC)
1. **GitHub Action Trigger**: Automated schedule activation
2. **Repository Scraping**: Fetch top 5 trending from github.com/trending
3. **Deduplication**: Check database for already processed repos (by date)
4. **AI Analysis**: For each new repository:
   - Extract: name, description, stars, language, URL
   - OpenAI prompt: Generate 3 detailed business ideas
   - Parse structured response (problem/solution/model/difficulty)
   - Fallback to template ideas if API fails
5. **Data Storage**: Save repositories and ideas to SQLite with full schema
6. **Multilingual Emails**: Send newsletters to Spanish and English subscribers separately
7. **Frontend Update**: New ideas automatically appear on landing page

## 🐛 Error Handling

### Robust Fallback Systems
- **GitHub Scraping Fails**: Use hardcoded trending repositories list
- **OpenAI API Fails**: Generate template ideas based on repository metadata
- **Email Delivery Issues**: Log failures, continue processing other subscribers
- **Database Errors**: Graceful error handling with detailed logging
- **Test Mode**: Automatic detection when API keys are placeholders

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

## 🚢 Production Checklist

### GitHub Repository Setup
- [x] Repository created at https://github.com/manu030/reporadar
- [x] GitHub Actions workflow configured (Mon/Wed/Sat 4 AM UTC)
- [ ] Configure GitHub Secrets:
  - `OPENAI_API_KEY`
  - `RESEND_API_KEY` 
  - `RESEND_FROM_EMAIL`
  - `NEXT_PUBLIC_BASE_URL`

### Vercel Deployment
- [ ] Connect GitHub repo to Vercel
- [ ] Configure environment variables in Vercel
- [ ] Set up custom domain (optional)
- [ ] Test Vercel cron jobs functionality
- [ ] Verify multilingual routing (/en paths)

### Final Testing
- [x] End-to-end pipeline testing completed
- [x] Multilingual email system verified
- [x] Database schema with i18n support
- [x] UI with custom logo and Oi font
- [ ] Production email delivery testing

## 📞 Soporte y Mantenimiento

### Available Commands
```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run init-db          # Initialize SQLite database

# Testing
npm run test-scraper     # Test GitHub trending scraper
npm run test-analyzer    # Test OpenAI analysis with fallbacks
npm run test-mailer      # Test multilingual email system

# Production
npm run daily-analysis   # Run complete analysis pipeline

# Database inspection
sqlite3 data/database.sqlite
.tables                  # Show all tables
.schema users           # Show user table schema
SELECT * FROM users;    # View all subscribers
```

### Backup Strategy
- **Automated**: Daily SQLite backup to Vercel Blob
- **Manual**: Weekly export de suscriptores
- **Recovery**: Restore desde GitHub releases

---

*Última actualización: Agosto 2025*