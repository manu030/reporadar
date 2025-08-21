# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Database & Testing
```bash
npm run init-db          # Initialize SQLite database with schema
npm run daily-analysis   # Run complete daily analysis cycle
npm run test-scraper     # Test GitHub trending scraper only
npm run test-analyzer    # Test OpenAI idea generation only  
npm run test-mailer      # Test email sending only
```

### Database Queries
```bash
sqlite3 data/database.sqlite
# Common queries:
# SELECT COUNT(*) FROM users;
# SELECT * FROM processed_repos WHERE processed_date = date('now');
# SELECT * FROM ideas WHERE generated_date = date('now');
```

## Architecture

RepoRadar is a Next.js application that automatically scrapes GitHub trending repositories and generates business ideas using AI, then sends them via newsletter.

### Core Data Flow
1. **Daily GitHub Actions trigger** (6:00 AM UTC) calls `/api/cron/daily`
2. **Scraper** (`lib/scraper.js`) fetches top 5 trending repos from GitHub
3. **Analyzer** (`lib/analyzer.js`) sends repo data to OpenAI to generate 3 business ideas per repo
4. **Database** (`lib/database.js`) stores repos and ideas in SQLite
5. **Mailer** (`lib/mailer.js`) sends newsletters to all subscribers
6. **Frontend** displays latest ideas on landing page

### Database Schema (SQLite)
```sql
-- Updated schema with internationalization support
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    locale TEXT DEFAULT 'es',           -- 'es' or 'en' for i18n
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id INTEGER NOT NULL,
    idea_number INTEGER NOT NULL,
    idea_oneliner TEXT NOT NULL,        -- Brief description
    idea_problem TEXT NOT NULL,         -- Problem statement  
    idea_solution TEXT NOT NULL,        -- Solution description
    idea_business_model TEXT NOT NULL,  -- Business model
    idea_difficulty TEXT NOT NULL,      -- 'Fácil', 'Medio', 'Difícil'
    generated_date DATE NOT NULL,
    FOREIGN KEY (repo_id) REFERENCES processed_repos (id)
);
```

### Key Components

**Database Class** (`lib/database.js`):
- Handles SQLite connection lifecycle
- Methods: `addUser(email, locale)`, `addProcessedRepo()`, `addIdeas()`, `getLatestIdeas()`
- Auto-creates data directory if not exists

**Scraper** (`lib/scraper.js`):  
- Scrapes https://github.com/trending?since=daily
- Uses Cheerio for HTML parsing with multiple CSS selector fallbacks
- Extracts: repo name, URL, description, stars, language
- Has fallback mock data for development

**Analyzer** (`lib/analyzer.js`):
- OpenAI integration with structured JSON responses
- Generates 5 fields per idea: oneliner, problem, solution, business_model, difficulty
- Model fallback: gpt-4o-mini → gpt-3.5-turbo-1106
- Has fallback template ideas when API fails

**Mailer** (`lib/mailer.js`):
- Uses Resend API for email delivery
- Sends plain text newsletters (not HTML)
- Batch processes emails to respect rate limits
- Supports both Spanish and English newsletters based on user locale

## Internationalization (i18n)

The application supports Spanish (default) and English:

### URL Structure
- `/` - Spanish version
- `/en` - English version

### Translation System
- `hooks/useTranslations.js` - Translation hook with complete string mappings
- `components/LanguageSelector.js` - ES/EN toggle with neobrutalist styling
- Separate API endpoints: `/api/subscribe` (Spanish) and `/api/en/subscribe` (English)
- Database stores user locale for separate newsletter lists

### Newsletter Lists
- Spanish subscribers receive Spanish newsletters
- English subscribers receive English newsletters  
- Same business ideas, translated presentation

## Styling (Neobrutalist Design)

Built with Tailwind CSS using a neobrutalist aesthetic:

### Color Palette
```javascript
primary: '#000000',      // Pure black
secondary: '#F5F1ED',    // Warm off-white  
accent: '#FF9B9B',       // Coral red
warning: '#F4CC46',      // Golden yellow
success: '#2D9B8B',      // Teal green
'gray-text': '#4A4A4A',  // Dark gray for text
```

### Design Principles
- Thick borders (`border-2`, `border-3`)
- Hard shadows (`shadow-brutal: 4px 4px 0px #000000`)
- No rounded corners (`rounded-sm` only)
- High contrast colors
- Bold typography (Inter font, `font-extrabold`)

### Key CSS Classes
```css
.btn-brutal           /* Main button style */
.btn-brutal-accent    /* Accent button style */  
.card-brutal          /* Card container style */
.input-brutal         /* Form input style */
```

## Error Handling & Resilience

### Common Failure Points
1. **GitHub Rate Limiting**: Scraper implements retry with exponential backoff
2. **OpenAI API Failures**: Fallback to template ideas, model degradation
3. **Email Delivery Issues**: Individual failure logging, don't fail entire batch
4. **Database Locks**: Connection pooling, proper connection lifecycle

### Development vs Production
- Development has fallback mock data when GitHub is unreachable
- Production uses environment variables for all API keys
- SQLite database auto-created in `data/` directory

## Environment Variables

Required for full functionality:
```env
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...  
RESEND_FROM_EMAIL=noreply@reporadar.com
NEXT_PUBLIC_BASE_URL=https://reporadar.vercel.app
```

## File Structure Notes

### Important Directories
- `lib/` - Core business logic (database, scraper, analyzer, mailer)
- `components/` - React components with i18n support
- `pages/api/` - API endpoints including separate `/en/` routes
- `scripts/` - Standalone executables for testing individual components
- `hooks/` - Custom React hooks including translation system
- `data/` - SQLite database file location

### Configuration Files
- `next.config.js` - Includes i18n setup and SQLite webpack config
- `tailwind.config.js` - Neobrutalist color palette and custom classes

The codebase prioritizes simplicity and reliability over complex features, with extensive fallback mechanisms for production resilience.