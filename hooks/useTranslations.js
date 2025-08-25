import { useRouter } from 'next/router';

const translations = {
  es: {
    // SEO meta
    pageTitle: 'Repo Radar | Ideas de Negocio desde GitHub Trending Diario',
    pageDescription: 'Descubre ideas de negocio basadas en los repositorios más trending de GitHub. Análisis diario con inteligencia artificial para emprendedores.',
    
    // Hero section
    title: 'Repo Radar',
    heroDescription: 'Descubre ideas de negocio basadas en los repositorios más trending de GitHub con',
    heroHighlight: 'análisis diario de inteligencia artificial.',
    
    // Newsletter form
    subscribeTitle: 'Apúntate a la newsletter',
    subscribeDescription: 'Recibe cada día análisis de los repos que más están triunfando en GitHub con ideas de negocio generadas por IA.',
    emailPlaceholder: 'tu-email@ejemplo.com',
    subscribeButton: '🚀 Apuntarme',
    subscribingButton: '⏳ Apuntándote...',
    subscribedButton: '✅ ¡Suscrito!',
    retryButton: '🔄 Intentar de nuevo',
    freeForever: '',
    helpImprove: '💡 Ayúdanos a mejorar',
    shareIdeas: 'Comparte tus ideas',
    
    // Ideas section
    latestIdeas: 'Últimas Ideas de Negocio Generadas',
    analysisDate: 'Análisis del',
    businessIdeas: 'Ideas de negocio',
    analyzed: 'Analizado:',
    viewOnGithub: 'Ver en GitHub →',
    
    // Idea details
    problem: 'Problema',
    solution: 'Solución',
    businessModel: 'Modelo de negocio',
    difficulty: 'Dificultad:',
    
    // Difficulty levels
    easy: '⚡ Fácil',
    medium: '⭐ Medio',
    hard: '🔥 Difícil',
    
    // Fallback text for legacy data
    problemTbd: 'Problema por definir',
    solutionTbd: 'Solución por definir',
    modelTbd: 'Modelo por definir',
    noIdea: 'Idea no disponible',
    
    // Accessibility labels
    difficultyLevel: 'Nivel de dificultad',
    expandIdea: 'Expandir',
    collapseIdea: 'Contraer',
    businessIdea: 'idea de negocio',
    clickToExpand: 'Haz clic para expandir detalles de la idea',
    clickToCollapse: 'Haz clic para contraer detalles de la idea',
    
    // CTA section
    ctaTitle: '¿Listo para descubrir tu próximo negocio?',
    ctaDescription: 'Únete a las personas que ya reciben ideas de negocio basadas en las últimas tendencias tech.',
    
    // Footer
    footerMadeBy: 'Hecho por',
    footerCommunity: 'para la comunidad vibe coder',
    
    // Messages
    successMessage: '¡Suscripción exitosa! Revisa tu email.',
    invalidEmailMessage: 'Por favor ingresa un email válido',
    errorMessage: 'Error en la suscripción',
    connectionErrorMessage: 'Error conectando con el servidor',
    noIdeasMessage: 'Ideas no disponibles para este repositorio',
    preparingMessage: '¡Estamos preparando algo increíble!',
    firstAnalysisMessage: 'El primer análisis se ejecutará muy pronto. Apúntate para no perdértelo.',
    aiWorkingMessage: '🤖 IA trabajando en el primer análisis...',
  },
  
  en: {
    // SEO meta
    pageTitle: 'Repo Radar | Business Ideas from Daily GitHub Trending Analysis',
    pageDescription: 'Discover business ideas based on GitHub\'s most trending repositories. Daily AI analysis for entrepreneurs and startup founders.',
    
    // Hero section
    title: 'Repo Radar',
    heroDescription: 'Discover business ideas based on GitHub\'s most trending repositories with',
    heroHighlight: 'daily artificial intelligence analysis.',
    
    // Newsletter form
    subscribeTitle: 'Subscribe to newsletter',
    subscribeDescription: 'Get daily analysis of the most trending GitHub repos with AI-generated business ideas.',
    emailPlaceholder: 'your-email@example.com',
    subscribeButton: '🚀 Subscribe',
    subscribingButton: '⏳ Subscribing...',
    subscribedButton: '✅ Subscribed!',
    retryButton: '🔄 Try again',
    freeForever: '',
    helpImprove: '💡 Help us improve',
    shareIdeas: 'Share your ideas',
    
    // Ideas section
    latestIdeas: 'Latest Business Ideas Generated',
    analysisDate: 'Analysis from',
    businessIdeas: 'Business ideas',
    analyzed: 'Analyzed:',
    viewOnGithub: 'View on GitHub →',
    
    // Idea details
    problem: 'Problem',
    solution: 'Solution',
    businessModel: 'Business model',
    difficulty: 'Difficulty:',
    
    // Difficulty levels
    easy: '⚡ Easy',
    medium: '⭐ Medium',
    hard: '🔥 Hard',
    
    // Fallback text for legacy data
    problemTbd: 'Problem to be defined',
    solutionTbd: 'Solution to be defined',
    modelTbd: 'Model to be defined',
    noIdea: 'No idea available',
    
    // Accessibility labels
    difficultyLevel: 'Difficulty level',
    expandIdea: 'Expand',
    collapseIdea: 'Collapse',
    businessIdea: 'business idea',
    clickToExpand: 'Click to expand idea details',
    clickToCollapse: 'Click to collapse idea details',
    
    // CTA section
    ctaTitle: 'Ready to discover your next business?',
    ctaDescription: 'Join people who already receive business ideas based on the latest tech trends.',
    
    // Footer
    footerMadeBy: 'Made by',
    footerCommunity: 'for the vibe coder community',
    
    // Messages
    successMessage: 'Subscription successful! Check your email.',
    invalidEmailMessage: 'Please enter a valid email',
    errorMessage: 'Subscription error',
    connectionErrorMessage: 'Error connecting to server',
    noIdeasMessage: 'Ideas not available for this repository',
    preparingMessage: 'We\'re preparing something incredible!',
    firstAnalysisMessage: 'The first analysis will run very soon. Subscribe so you don\'t miss it.',
    aiWorkingMessage: '🤖 AI working on the first analysis...',
  }
};

export default function useTranslations() {
  const { locale } = useRouter();
  
  return translations[locale] || translations.es;
}