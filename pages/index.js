import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import SubscribeForm from '../components/SubscribeForm';
import IdeaCard from '../components/IdeaCard';
import useTranslations from '../hooks/useTranslations';

export default function Home({ latestIdeas, stats, allDates }) {
  const t = useTranslations();
  const router = useRouter();
  const [formattedDate, setFormattedDate] = useState('');
  const [selectedDate, setSelectedDate] = useState(router.query.date || '');
  const [currentIdeas, setCurrentIdeas] = useState(latestIdeas);
  
  // Handle date changes
  useEffect(() => {
    if (router.query.date && router.query.date !== selectedDate) {
      setSelectedDate(router.query.date);
    }
  }, [router.query.date]);

  // Load ideas for selected date
  useEffect(() => {
    const loadIdeasForDate = async () => {
      if (selectedDate && selectedDate !== getCurrentDate()) {
        try {
          const response = await fetch(`/api/ideas?date=${selectedDate}`);
          const data = await response.json();
          setCurrentIdeas(data.ideas || []);
        } catch (error) {
          console.error('Error loading ideas for date:', error);
        }
      } else {
        setCurrentIdeas(latestIdeas);
      }
    };
    
    loadIdeasForDate();
  }, [selectedDate, latestIdeas]);

  // Client-side date formatting to avoid hydration mismatch
  useEffect(() => {
    const ideasToFormat = currentIdeas.length > 0 ? currentIdeas : latestIdeas;
    if (ideasToFormat.length > 0 && ideasToFormat[0].processed_date) {
      try {
        const date = new Date(ideasToFormat[0].processed_date);
        const formatted = date.toLocaleDateString('es-ES', {
          day: 'numeric', 
          month: 'long', 
          year: 'numeric'
        });
        setFormattedDate(`${t.analysisDate} ${formatted}`);
      } catch (error) {
        setFormattedDate('Próximamente');
      }
    } else {
      setFormattedDate('Próximamente');
    }
  }, [currentIdeas, latestIdeas, t.analysisDate]);

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleDateChange = (date) => {
    if (date === getCurrentDate()) {
      router.push('/', undefined, { shallow: true });
    } else {
      router.push(`/?date=${date}`, undefined, { shallow: true });
    }
  };
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="border-b-3 border-primary bg-secondary pt-0 pb-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <img 
              src="/reporadar_logo.png" 
              alt="Repo Radar Logo" 
              className="w-24 h-24 mx-auto mb-4"
              style={{
                animation: 'float 3s ease-in-out infinite'
              }}
            />
            <h1 className="text-3xl sm:text-4xl md:text-6xl leading-tight mb-4 sm:mb-6" style={{fontFamily: 'Rowdies, cursive', fontWeight: 400, color: '#222'}}>
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
      <section id="ideas" className="py-8 sm:py-12 md:py-16" style={{backgroundColor: '#F3F4F6'}}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-primary mb-3 sm:mb-4">
              💡 {t.latestIdeas}
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-text px-2 mb-4">
              {formattedDate || 'Próximamente'}
            </p>
            
            {/* Date Navigation */}
            {allDates && allDates.length > 1 && (
              <div className="max-w-md mx-auto mb-6">
                <select
                  value={selectedDate || getCurrentDate()}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="input-brutal w-full text-center font-semibold"
                >
                  <option value={getCurrentDate()}>Hoy - Últimas ideas</option>
                  {allDates.filter(date => date !== getCurrentDate()).map(date => {
                    const dateObj = new Date(date);
                    const formatted = dateObj.toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                    return (
                      <option key={date} value={date}>
                        {formatted}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {currentIdeas.length > 0 ? (
            <div className="space-y-6 sm:space-y-8">
              {currentIdeas.map((repo, index) => (
                <IdeaCard 
                  key={repo.repo_id || `repo-${index}`} 
                  repo={repo} 
                  ideas={Array.isArray(repo.ideas) ? repo.ideas : []} 
                  index={index}
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

export async function getServerSideProps(context) {
  // Importar Database aquí para evitar problemas con webpack
  const Database = require('../lib/database');
  const DailyAnalysis = require('../scripts/daily-analysis');
  
  // Get locale from context (will be 'es' or 'en')
  const locale = context.locale || 'es';
  
  try {
    const db = new Database();
    await db.connect();
    
    // Obtener últimas ideas for the specific locale
    const latestIdeas = await db.getLatestIdeas(locale);
    
    // Obtener estadísticas
    const analysis = new DailyAnalysis();
    const stats = await analysis.getStats();
    
    // Obtener fechas disponibles para navegación
    const allDates = await db.getAvailableDates();
    
    await db.close();
    
    // Serialize Firebase Timestamps and handle undefined values recursively
    const serialize = (obj) => {
      try {
        if (obj === null || obj === undefined) return null;
        if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
        if (obj && obj.toDate && typeof obj.toDate === 'function') return obj.toDate().toISOString();
        if (Array.isArray(obj)) return obj.map(serialize);
        if (typeof obj === 'object') {
          const serialized = {};
          for (const [key, value] of Object.entries(obj)) {
            try {
              serialized[key] = serialize(value);
            } catch (e) {
              // Skip problematic values
              serialized[key] = null;
            }
          }
          return serialized;
        }
        return obj;
      } catch (e) {
        return null;
      }
    };

    const serializedIdeas = serialize(latestIdeas || []) || [];
    
    // Normalize data structure for hydration consistency
    const normalizedIdeas = serializedIdeas.map(repo => ({
      ...repo,
      ideas: Array.isArray(repo.ideas) ? repo.ideas : [],
      processed_date: repo.processed_date ? new Date(repo.processed_date).toISOString() : null,
      created_at: repo.created_at ? new Date(repo.created_at).toISOString() : null
    }));

    return {
      props: {
        latestIdeas: normalizedIdeas,
        stats: stats || null,
        allDates: allDates || []
      }
    };
    
  } catch (error) {
    console.error('Error loading data for homepage:', error.message);
    
    return {
      props: {
        latestIdeas: [],
        stats: null,
        allDates: []
      }
    };
  }
}