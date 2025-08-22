import { useState } from 'react';
import useTranslations from '../hooks/useTranslations';

// Función para traducir y mejorar descripciones de repos
const translateAndEnhanceDescription = (repoName, originalDescription, language, stars) => {
  const repoKey = repoName.toLowerCase();
  
  // Traducciones y contexto específicos por repositorio popular
  const translations = {
    'microsoft/terminal': 'Nueva terminal moderna de Windows con pestañas, temas personalizables y características avanzadas para desarrolladores. Reemplaza al Command Prompt tradicional.',
    'openai/whisper': 'Sistema de reconocimiento de voz de OpenAI entrenado con 680.000 horas de audio. Transforma audio a texto con alta precisión en múltiples idiomas.',
    'puppeteer/puppeteer': 'API de JavaScript para controlar navegadores Chrome/Firefox sin interfaz. Permite automatizar testing, scraping web y generación de PDFs.',
    'vercel/next.js': 'Framework React para producción con características como renderizado híbrido, optimización automática de imágenes y routing basado en archivos.',
    'huggingface/transformers': 'Biblioteca Python para modelos de procesamiento de lenguaje natural (NLP) pre-entrenados. Incluye BERT, GPT, T5 y miles de modelos más.',
    'tailwindlabs/tailwindcss': 'Framework CSS utility-first que permite crear diseños personalizados rápidamente usando clases predefinidas en lugar de CSS personalizado.',
    'bitwarden/clients': 'Aplicaciones cliente del gestor de contraseñas Bitwarden para web, extensiones de navegador, escritorio y línea de comandos.',
    'leantime/leantime': 'Sistema de gestión de proyectos diseñado específicamente para personas con TDAH, autismo y dislexia. Enfoque simplificado en objetivos.',
    'simstudioai/sim': 'Constructor visual de workflows para agentes de IA. Interfaz intuitiva para crear y desplegar modelos de lenguaje grandes (LLMs) sin código.',
    'moeru-ai/airi': 'Compañero virtual AI auto-hospedado. Sistema de contenedor de "almas waifu" para interacciones con personajes de IA en tu propio servidor.'
  };
  
  if (translations[repoKey]) {
    return translations[repoKey];
  }
  
  // Traducción genérica mejorada
  let enhanced = originalDescription;
  
  // Traducciones comunes
  const commonTranslations = {
    'JavaScript API for': 'API de JavaScript para',
    'The new Windows': 'La nueva',
    'Self hosted': 'Auto-hospedado',
    'open-source': 'código abierto',
    'framework for': 'framework para',
    'client apps': 'aplicaciones cliente',
    'utility-first CSS framework': 'framework CSS utility-first',
    'project management system': 'sistema de gestión de proyectos',
    'AI agent workflow builder': 'constructor de workflows para agentes IA',
    'State-of-the-art Machine Learning': 'Aprendizaje automático de última generación',
    'Robust Speech Recognition': 'Reconocimiento de voz robusto',
    'Goals focused': 'Enfocado en objetivos'
  };
  
  Object.entries(commonTranslations).forEach(([en, es]) => {
    enhanced = enhanced.replace(new RegExp(en, 'gi'), es);
  });
  
  // Añadir contexto basado en el lenguaje y popularidad
  const languageContext = {
    'TypeScript': 'Desarrollado en TypeScript',
    'JavaScript': 'Herramienta JavaScript',
    'Python': 'Biblioteca Python',
    'Vue': 'Aplicación Vue.js', 
    'C++': 'Software nativo C++',
    'PHP': 'Aplicación web PHP',
    'Go': 'Herramienta Go',
    'Rust': 'Software Rust'
  };
  
  const starsContext = stars > 50000 ? '⭐ Muy popular en la comunidad' : 
                      stars > 10000 ? '🌟 Popular entre desarrolladores' : 
                      '🚀 Proyecto emergente';
  
  return `${enhanced}. ${languageContext[language] || ''} ${starsContext}.`.replace(/\.\s+\./, '.');
};

export default function IdeaCard({ repo, ideas }) {
  const [expandedIdea, setExpandedIdea] = useState(null);
  const t = useTranslations();

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
              {translateAndEnhanceDescription(repo.repo_name, repo.repo_description, repo.language, repo.stars)}
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
              // Manejar ambos formatos: objeto completo o string simple
              const ideaData = typeof idea === 'string' 
                ? { 
                    idea_oneliner: idea,
                    idea_problem: 'Problema por definir',
                    idea_solution: 'Solución por definir',
                    idea_business_model: 'Modelo por definir',
                    idea_difficulty: 'Medio - Legacy data'
                  }
                : {
                    // Support both old format (idea_*) and new format (*)
                    idea_oneliner: idea.idea_oneliner || idea.oneliner,
                    idea_description: idea.idea_description || idea.description,
                    idea_problem: idea.idea_problem || idea.problem,
                    idea_solution: idea.idea_solution || idea.solution,
                    idea_business_model: idea.idea_business_model || idea.business_model,
                    idea_difficulty: idea.idea_difficulty || idea.difficulty
                  };
              
              return (
                <div 
                  key={index}
                  className="bg-gray-100 border-2 border-primary overflow-hidden rounded-sm"
                >
                  <button
                    onClick={() => toggleIdea(index)}
                    className="w-full p-3 sm:p-4 text-left hover:bg-gray-200 transition-colors duration-150 focus:outline-none focus:bg-gray-200 active:bg-gray-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start flex-1">
                        <span className="bg-accent text-primary font-extrabold px-2 sm:px-3 py-1 border border-primary mr-3 sm:mr-4 text-xs sm:text-sm flex-shrink-0 rounded-sm">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-primary font-extrabold text-base sm:text-lg leading-tight sm:leading-normal pr-2">
                            {ideaData.idea_oneliner}
                          </p>
                          {(ideaData.idea_description || ideaData.description) && (
                            <p className="text-gray-text text-sm sm:text-base leading-relaxed pr-2 mt-1">
                              {ideaData.idea_description || ideaData.description}
                            </p>
                          )}
                          <div className="mt-1 sm:mt-2">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold px-2 sm:px-3 py-1 text-xs sm:text-sm flex items-center gap-1 border-2 border-primary shadow-brutal-sm rounded-sm ${
                                ideaData.idea_difficulty?.toLowerCase().includes('fácil') 
                                  ? 'bg-success text-primary' 
                                  : ideaData.idea_difficulty?.toLowerCase().includes('difícil')
                                  ? 'bg-accent text-primary'
                                  : 'bg-warning text-primary'
                              }`}>
                                {ideaData.idea_difficulty?.toLowerCase().includes('fácil') 
                                  ? <>⚡ Fácil</>
                                  : ideaData.idea_difficulty?.toLowerCase().includes('difícil')
                                  ? <>🔥 Difícil</>
                                  : <>⭐ Medio</>
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-2 sm:ml-4 flex-shrink-0">
                        <span className="text-primary font-extrabold text-xl sm:text-2xl">
                          {isExpanded ? '−' : '+'}
                        </span>
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t-2 border-gray-300 bg-white">
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
                            <span className={`px-2 py-1 text-xs font-semibold border-2 border-primary shadow-brutal-sm text-center sm:text-left rounded-sm ${
                              ideaData.idea_difficulty?.toLowerCase().includes('fácil') 
                                ? 'bg-success text-primary' 
                                : ideaData.idea_difficulty?.toLowerCase().includes('difícil')
                                ? 'bg-accent text-primary'
                                : 'bg-warning text-primary'
                            }`}>
                              {ideaData.idea_difficulty?.toLowerCase().includes('fácil') 
                                ? '⚡ Fácil'
                                : ideaData.idea_difficulty?.toLowerCase().includes('difícil')
                                ? '🔥 Difícil'
                                : '⭐ Medio'
                              }
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
          📅 {t.analyzed} {new Date(repo.processed_date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
}