import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useTranslations from '../hooks/useTranslations';
import { getDifficultyBadge, normalizeIdeaData, getStarContext } from '../utils/ideaHelpers';

// Pre-compiled translation patterns for better performance
const TRANSLATION_PATTERNS = [
  { regex: /open-source/gi, replacement: { es: 'código abierto', en: 'open-source' }},
  { regex: /framework/gi, replacement: { es: 'framework', en: 'framework' }},
  { regex: /Self hosted/gi, replacement: { es: 'Auto-hospedado', en: 'Self hosted' }}
];

// Utility function for consistent dot normalization
const normalizeDots = (text) => text.replace(/\.(\s*\.)+/g, '.');

// Function to detect if text needs translation
const needsTranslation = (text, targetLocale) => {
  if (!text || typeof text !== 'string' || text.length < 5) {
    return false;
  }
  
  // Detect Chinese characters (simplified and traditional)
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
  
  // Detect Japanese characters (hiragana, katakana, kanji)
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/;
  
  // Detect Korean characters
  const koreanRegex = /[\uac00-\ud7af]/;
  
  // Detect Russian/Cyrillic characters
  const cyrillicRegex = /[\u0400-\u04ff]/;
  
  // Detect Arabic characters
  const arabicRegex = /[\u0600-\u06ff]/;
  
  // If target is Spanish, translate non-Latin scripts or non-English text
  if (targetLocale === 'es') {
    const hasNonLatinScript = chineseRegex.test(text) || 
                             japaneseRegex.test(text) || 
                             koreanRegex.test(text) ||
                             cyrillicRegex.test(text) ||
                             arabicRegex.test(text);
    
    if (hasNonLatinScript) {
      return true;
    }
  }
  
  // If target is English, translate non-English text
  if (targetLocale === 'en') {
    const hasNonLatinScript = chineseRegex.test(text) || 
                             japaneseRegex.test(text) || 
                             koreanRegex.test(text) ||
                             cyrillicRegex.test(text) ||
                             arabicRegex.test(text);
    
    if (hasNonLatinScript) {
      return true;
    }
  }
  
  return false;
};

// Function to translate text using AI
const translateDescription = async (text, targetLocale) => {
  try {
    const targetLanguage = targetLocale === 'es' ? 'Spanish' : 'English';
    
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        targetLanguage: targetLanguage
      })
    });
    
    if (!response.ok) {
      throw new Error('Translation failed');
    }
    
    const data = await response.json();
    return data.translation || text; // Fallback to original if no translation
  } catch (error) {
    console.warn('Translation failed:', error.message);
    return text; // Fallback to original text
  }
};

// Función para traducir y mejorar descripciones de repos
// Enhanced HTML cleaning function for repository descriptions
const cleanHtmlDescription = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  let cleaned = html;
  
  // Remove script and style tags first (security)
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove all HTML tags completely
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&#34;/g, '"');
  
  // Remove markdown-style artifacts
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, ''); // ![alt](url)
  cleaned = cleaned.replace(/\[.*?\]\(.*?\)/g, ''); // [text](url)
  
  // Clean up excessive whitespace and special characters
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .trim();
  
  // If the result still has HTML artifacts, clean more aggressively
  if (cleaned.includes('<') || cleaned.includes('>')) {
    // More aggressive cleaning for malformed HTML
    cleaned = cleaned.replace(/[<>]/g, '').replace(/align="[^"]*"/g, '').replace(/width="[^"]*"/g, '').replace(/src="[^"]*"/g, '');
  }
  
  // If the result is still too short or empty, provide fallback
  if (cleaned.length < 15) {
    return 'Proyecto de código abierto innovador con gran potencial comercial';
  }
  
  return cleaned;
};

const translateAndEnhanceDescription = (repoName, originalDescription, _language, stars, locale) => {
  // Input validation
  if (!originalDescription || typeof originalDescription !== 'string') {
    return locale === 'en' ? 'No description available' : 'Descripción no disponible';
  }
  
  // Secure HTML cleaning with input validation
  const cleanDescription = cleanHtmlDescription(originalDescription);
  
  // If English, return original description with minimal enhancement
  if (locale === 'en') {
    const starsContext = getStarContext(stars, locale);
    return normalizeDots(`${cleanDescription}. ${starsContext}`);
  }
  
  // Spanish translations for popular repos (keep only essential ones)
  const repoKey = repoName.toLowerCase();
  const translations = {
    'microsoft/terminal': 'Nueva terminal moderna de Windows con pestañas, temas personalizables y características avanzadas para desarrolladores. Reemplaza al Command Prompt tradicional.',
    'openai/whisper': 'Sistema de reconocimiento de voz de OpenAI entrenado con 680.000 horas de audio. Transforma audio a texto con alta precisión en múltiples idiomas.',
    'vercel/next.js': 'Framework React para producción con características como renderizado híbrido, optimización automática de imágenes y routing basado en archivos.',
    'huggingface/transformers': 'Biblioteca Python para modelos de procesamiento de lenguaje natural (NLP) pre-entrenados. Incluye BERT, GPT, T5 y miles de modelos más.',
    'tailwindlabs/tailwindcss': 'Framework CSS utility-first que permite crear diseños personalizados rápidamente usando clases predefinidas en lugar de CSS personalizado.'
  };
  
  if (translations[repoKey]) {
    return translations[repoKey];
  }
  
  // Apply pre-compiled translation patterns efficiently
  let enhanced = cleanDescription;
  
  TRANSLATION_PATTERNS.forEach(({ regex, replacement }) => {
    enhanced = enhanced.replace(regex, replacement.es);
  });
  
  // Add simple context
  const starsContext = getStarContext(stars, locale);
  return normalizeDots(`${enhanced}. ${starsContext}`);
};

// Function to slugify repo name for URL anchor
const slugifyRepoName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

export default function IdeaCard({ repo, ideas, index }) {
  const [expandedIdea, setExpandedIdea] = useState(null);
  const [translatedDescription, setTranslatedDescription] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const t = useTranslations();
  const { locale } = useRouter();

  const toggleIdea = (index) => {
    setExpandedIdea(expandedIdea === index ? null : index);
  };

  // Auto-translate description if needed
  useEffect(() => {
    const handleTranslation = async () => {
      if (!repo.repo_description || isTranslating || translatedDescription) {
        return;
      }

      const cleanDescription = cleanHtmlDescription(repo.repo_description);
      
      if (needsTranslation(cleanDescription, locale)) {
        setIsTranslating(true);
        try {
          const translated = await translateDescription(cleanDescription, locale);
          if (translated !== cleanDescription) {
            setTranslatedDescription(translated);
          }
        } catch (error) {
          console.warn('Translation failed:', error);
        } finally {
          setIsTranslating(false);
        }
      }
    };

    handleTranslation();
  }, [repo.repo_description, locale, translatedDescription, isTranslating]);

  // Create unique ID for this repo card using repo name or index
  const repoId = `repo-${slugifyRepoName(repo.repo_name) || index}`;

  return (
    <div id={repoId} className="card-brutal mb-4 sm:mb-6">
      <div className="flex flex-col space-y-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:space-y-0 space-y-3">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-primary mb-2 sm:mb-3">
              🔥 {repo.repo_name}
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className="bg-warning px-3 py-2 border-2 border-primary font-semibold text-sm sm:text-base text-center rounded-sm">
                ⭐ {repo.stars?.toLocaleString() || 'N/A'}
              </span>
              <span className="bg-success px-3 py-2 border-2 border-primary font-semibold text-sm sm:text-base text-center rounded-sm">
                💻 {repo.language || 'Unknown'}
              </span>
            </div>
            
            <p className="text-gray-text mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">
              {isTranslating ? (
                <span className="opacity-75">
                  🔄 {locale === 'es' ? 'Traduciendo...' : 'Translating...'}
                </span>
              ) : (
                translatedDescription 
                  ? translateAndEnhanceDescription(repo.repo_name, translatedDescription, repo.language, repo.stars, locale)
                  : translateAndEnhanceDescription(repo.repo_name, repo.repo_description, repo.language, repo.stars, locale)
              )}
            </p>
          </div>
          
          <div className="sm:ml-4 w-full sm:w-auto">
            <a
              href={repo.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full sm:inline-block bg-primary text-secondary px-4 py-3 sm:py-2 border-2 border-primary shadow-brutal-sm font-semibold hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-150 text-center rounded-sm"
            >
              {t.viewOnGithub}
            </a>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-extrabold text-lg text-primary">
          💡 {t.businessIdeas} ({ideas?.length || 0})
        </h4>
        
        {ideas && ideas.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {ideas.map((idea, index) => {
              const isExpanded = expandedIdea === index;
              // Use the improved data normalization helper
              const ideaData = normalizeIdeaData(idea, t);
              const difficultyBadge = getDifficultyBadge(ideaData.idea_difficulty, locale, t);
              
              return (
                <div 
                  key={index}
                  className="bg-gray-100 border-2 border-primary overflow-hidden rounded-sm"
                >
                  <button
                    onClick={() => toggleIdea(index)}
                    aria-expanded={isExpanded}
                    aria-describedby={`idea-content-${index}`}
                    aria-label={`${isExpanded ? t.collapseIdea : t.expandIdea} ${t.businessIdea} ${index + 1}: ${ideaData.idea_oneliner}`}
                    className="w-full p-3 sm:p-4 text-left hover:bg-gray-200 transition-colors duration-150 focus:outline-none focus:bg-gray-200 active:bg-gray-300 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start flex-1">
                        <span className="bg-accent text-primary font-extrabold px-2 sm:px-3 py-1 border border-primary mr-3 sm:mr-4 text-xs sm:text-sm flex-shrink-0 rounded-sm">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p id={`idea-title-${index}`} className="text-primary font-extrabold text-base sm:text-lg leading-tight sm:leading-normal pr-2">
                            {ideaData.idea_oneliner}
                          </p>
                          {(ideaData.idea_description || ideaData.description) && (
                            <p className="text-gray-text text-sm sm:text-base leading-relaxed pr-2 mt-1">
                              {ideaData.idea_description || ideaData.description}
                            </p>
                          )}
                          <div className="mt-1 sm:mt-2">
                            <div className="flex items-center gap-2">
                              <span 
                                className={`font-semibold px-2 sm:px-3 py-1 text-xs sm:text-sm flex items-center gap-1 border-2 border-primary shadow-brutal-sm rounded-sm ${difficultyBadge.bgColor} text-primary`}
                                role="status"
                                aria-label={`${t.difficultyLevel}: ${difficultyBadge.text}`}
                              >
                                <span aria-hidden="true">{difficultyBadge.emoji}</span>
                                <span>{difficultyBadge.text}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-2 sm:ml-4 flex-shrink-0">
                        <span className="text-primary font-extrabold text-xl sm:text-2xl" aria-hidden="true">
                          {isExpanded ? '−' : '+'}
                        </span>
                        <span className="sr-only">
                          {isExpanded ? t.clickToCollapse : t.clickToExpand}
                        </span>
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div 
                      id={`idea-content-${index}`}
                      role="region"
                      aria-labelledby={`idea-title-${index}`}
                      className="px-3 sm:px-4 pb-3 sm:pb-4 border-t-2 border-gray-300 bg-white"
                    >
                      <div className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                        <div>
                          <h6 className="font-extrabold text-primary mb-2 flex items-center text-sm sm:text-base">
                            🎯 {t.problem}
                          </h6>
                          <p className="text-gray-text leading-relaxed text-sm sm:text-base">
                            {ideaData.idea_problem}
                          </p>
                        </div>
                        
                        <div>
                          <h6 className="font-extrabold text-primary mb-2 flex items-center text-sm sm:text-base">
                            💡 {t.solution}
                          </h6>
                          <p className="text-gray-text leading-relaxed text-sm sm:text-base">
                            {ideaData.idea_solution}
                          </p>
                        </div>
                        
                        <div>
                          <h6 className="font-extrabold text-primary mb-2 flex items-center text-sm sm:text-base">
                            💰 {t.businessModel}
                          </h6>
                          <p className="text-gray-text leading-relaxed text-sm sm:text-base">
                            {ideaData.idea_business_model}
                          </p>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
                            <span 
                              className={`px-2 py-1 text-xs font-semibold border-2 border-primary shadow-brutal-sm text-center sm:text-left rounded-sm ${difficultyBadge.bgColor} text-primary`}
                              role="status"
                              aria-label={`${t.difficultyLevel}: ${difficultyBadge.text}`}
                            >
                              <span aria-hidden="true">{difficultyBadge.emoji}</span>
                              <span>{difficultyBadge.text}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-100 border-2 border-primary p-4 sm:p-6 text-center rounded-sm">
            <div className="text-3xl sm:text-4xl mb-3">🤖</div>
            <p className="text-gray-text font-medium text-sm sm:text-base">
              {t.noIdeasMessage}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t-2 border-gray-300">
        <p className="text-xs sm:text-sm text-gray-text font-medium">
          📅 {t.analyzed} {new Date(repo.processed_date).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
}