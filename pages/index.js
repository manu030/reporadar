import Layout from '../components/Layout';
import SubscribeForm from '../components/SubscribeForm';
import IdeaCard from '../components/IdeaCard';
import useTranslations from '../hooks/useTranslations';

export default function Home({ latestIdeas, stats }) {
  const t = useTranslations();
  
  return (
    <Layout 
      title="Reporadar | Daily GitHub trending analysis"
      description="Descubre ideas de negocio basadas en los repositorios más trending de GitHub. Análisis diario con inteligencia artificial."
    >
      {/* Hero Section */}
      <section className="border-b-3 border-primary bg-secondary py-8 sm:py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <img 
              src="/reporadar_logo.png" 
              alt="RepoRadar Logo" 
              className="w-24 h-24 mx-auto mb-4"
            />
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold leading-tight mb-4 sm:mb-6" style={{fontFamily: 'Rowdies, cursive', color: '#222'}}>
              {t.title}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-text max-w-3xl mx-auto mb-6 sm:mb-8 px-2">
              {t.heroDescription} <span className="text-accent">{t.heroHighlight}</span>
            </p>
          </div>

          <div className="px-2 sm:px-0">
            <SubscribeForm />
          </div>
        </div>
      </section>


      {/* Latest Ideas Section */}
      <section className="py-8 sm:py-12 md:py-16" style={{backgroundColor: '#F3F4F6'}}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-primary mb-3 sm:mb-4">
              💡 {t.latestIdeas}
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-text px-2">
              {latestIdeas.length > 0 
                ? `${t.analysisDate} ${new Date(latestIdeas[0].processed_date).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}`
                : 'Soon you will have incredible ideas here'
              }
            </p>
          </div>

          {latestIdeas.length > 0 ? (
            <div className="space-y-6 sm:space-y-8">
              {latestIdeas.map((repo, index) => (
                <IdeaCard 
                  key={repo.repo_id} 
                  repo={repo} 
                  ideas={repo.ideas} 
                />
              ))}
            </div>
          ) : (
            <div className="card-brutal text-center py-8 sm:py-10 md:py-12 mx-2 sm:mx-0">
              <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6">🚀</div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-primary mb-3 sm:mb-4">
                {t.preparingMessage}
              </h3>
              <p className="text-gray-text text-base sm:text-lg mb-4 sm:mb-6 px-2">
                {t.firstAnalysisMessage}
              </p>
              <div className="bg-warning px-4 sm:px-6 py-2 sm:py-3 border-3 border-primary shadow-brutal inline-block font-semibold text-sm sm:text-base rounded-sm">
                {t.aiWorkingMessage}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t-3 border-primary bg-accent py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary mb-4 sm:mb-6 px-2">
            {t.ctaTitle}
          </h2>
          <p className="text-lg sm:text-xl text-primary font-semibold mb-6 sm:mb-8 px-2 leading-relaxed">
            {t.ctaDescription}
          </p>
          
          <div className="max-w-md mx-auto px-2 sm:px-0">
            <SubscribeForm />
          </div>
          
        </div>
      </section>
    </Layout>
  );
}

export async function getServerSideProps() {
  // Importar Database aquí para evitar problemas con webpack
  const Database = require('../lib/database');
  const DailyAnalysis = require('../scripts/daily-analysis');
  
  try {
    const db = new Database();
    await db.connect();
    
    // Obtener últimas ideas
    const latestIdeas = await db.getLatestIdeas();
    
    // Obtener estadísticas
    const analysis = new DailyAnalysis();
    const stats = await analysis.getStats();
    
    await db.close();
    
    return {
      props: {
        latestIdeas: latestIdeas || [],
        stats: stats || null
      }
    };
    
  } catch (error) {
    console.error('Error loading data for homepage:', error.message);
    
    return {
      props: {
        latestIdeas: [],
        stats: null
      }
    };
  }
}