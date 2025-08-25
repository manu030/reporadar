import { useState } from 'react';
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

// Función para traducir y mejorar descripciones de repos
// Secure HTML cleaning function
const cleanHtmlDescription = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // More comprehensive HTML cleaning
  return html
    // Remove all HTML tags (including malicious ones)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities safely
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
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

export default function IdeaCard({ repo, ideas }) {
  const [expandedIdea, setExpandedIdea] = useState(null);
  const t = useTranslations();
  const { locale } = useRouter();

  const toggleIdea = (index) => {
    setExpandedIdea(expandedIdea === index ? null : index);
  };

  return (
    <div className="card-brutal mb-4 sm:mb-6">
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
              {translateAndEnhanceDescription(repo.repo_name, repo.repo_description, repo.language, repo.stars, locale)}
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