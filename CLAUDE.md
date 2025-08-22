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
npm run init-db          # Initialize Firebase Firestore (validation only)
npm run daily-analysis   # Run complete daily analysis cycle
npm run spain-newsletter # Run Spain newsletter (ES locale)
npm run usa-newsletter   # Run USA newsletter (EN locale)
npm run test-scraper     # Test GitHub trending scraper only
npm run test-analyzer    # Test OpenRouter idea generation only  
npm run test-mailer      # Test email sending only
```

### Firebase Console
```bash
# Access Firebase Console for data inspection:
# https://console.firebase.google.com/project/[PROJECT_ID]/firestore
# 
# Common operations via database.js methods:
# await db.getUserCount()
# await db.getLatestIdeas('es') 
# await db.getProcessedReposForDate('2025-08-22')
```

## Architecture

Repo Radar is a Next.js application that automatically scrapes GitHub trending repositories and generates business ideas using AI, then sends them via newsletter.

### Core Data Flow
1. **Daily GitHub Actions trigger** (spain-newsletter.yml at 15:00 UTC, usa-newsletter.yml at 16:00 UTC)
2. **Scraper** (`lib/scraper.js`) fetches top 3 trending repos from GitHub
3. **Analyzer** (`lib/analyzer.js`) sends repo data to OpenRouter API (Llama 3.1 70B/Mixtral 8x7B) to generate 3 business ideas per repo
4. **Database** (`lib/database.js`) stores repos and ideas in Firebase Firestore with LEAN deduplication
5. **Mailer** (`lib/mailer.js`) sends locale-specific newsletters to subscribers
6. **Frontend** displays latest ideas on landing page

### Database Schema (Firebase Firestore)
```javascript
// Collections structure:
users: {
  [hashed_email]: {
    email: string,
    locale: 'es' | 'en',
    created_at: Timestamp
  }
}

processed_repos: {
  [doc_id]: {
    repo_name: string,
    repo_url: string, 
    repo_description: string,
    stars: number,
    language: string,
    processed_date: string, // YYYY-MM-DD
    created_at: Timestamp,
    ideas: {
      es: [{ oneliner, problem, solution, business_model, difficulty }],
      en: [{ oneliner, problem, solution, business_model, difficulty }]
    }
  }
}
```

### Key Components

**Database Class** (`lib/database.js`):
- Handles Firebase Firestore connection
- Methods: `addUser(email, locale)`, `saveRepoWithIdeas()`, `getLatestIdeas()` with LEAN deduplication
- Uses SHA256 hashing for secure email-based document IDs

**Scraper** (`lib/scraper.js`):  
- Scrapes https://github.com/trending?since=daily
- Uses Cheerio for HTML parsing with multiple CSS selector fallbacks
- Extracts: repo name, URL, description, stars, language
- Has fallback mock data for development

**Analyzer** (`lib/analyzer.js`):
- OpenRouter API integration with structured JSON responses
- Generates 5 fields per idea: oneliner, problem, solution, business_model, difficulty
- Model fallback: Llama 3.1 70B → Mixtral 8x7B → template ideas
- Bilingual idea generation (Spanish and English)

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
- Production uses environment variables for all API keys and Firebase credentials
- Firebase Firestore provides cloud database with automatic scaling
- LEAN deduplication prevents newsletter duplicate repositories

## Environment Variables

Required for full functionality:
```env
# AI Analysis
OPENROUTER_API_KEY=sk-or-...
OPENAI_API_KEY=sk-...           # Fallback for analyzer

# Email Service  
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@reporadar.xyz

# Firebase Firestore
FIREBASE_PROJECT_ID=reporadar-...
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@reporadar.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=...
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...

# Application
NEXT_PUBLIC_BASE_URL=https://reporadar.xyz
```

## File Structure Notes

### Important Directories
- `lib/` - Core business logic (database, scraper, analyzer, mailer)
- `components/` - React components with i18n support
- `pages/api/` - API endpoints including separate `/en/` routes
- `scripts/` - Standalone executables for newsletter automation and testing
- `hooks/` - Custom React hooks including translation system
- `.github/workflows/` - GitHub Actions for automated newsletter delivery

### Configuration Files
- `next.config.js` - Includes i18n setup and webpack configuration
- `tailwind.config.js` - Neobrutalist color palette and custom classes
- `.github/workflows/` - Automated newsletter scheduling (spain-newsletter.yml, usa-newsletter.yml)

The codebase prioritizes simplicity and reliability over complex features, with extensive fallback mechanisms for production resilience.