import Head from 'next/head';
import LanguageSelector from './LanguageSelector';
import useTranslations from '../hooks/useTranslations';
import { useRouter } from 'next/router';

export default function Layout({ children, title, description }) {
  const t = useTranslations();
  const { locale, asPath } = useRouter();
  
  // Use translations for default meta if not provided
  const finalTitle = title || t.pageTitle;
  const finalDescription = description || t.pageDescription;
  
  // Build hreflangs
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const canonicalUrl = `${baseUrl}${locale === 'en' ? '/en' : ''}${asPath === '/' ? '' : asPath}`;
  const hreflangs = {
    es: `${baseUrl}${asPath === '/' ? '' : asPath}`,
    en: `${baseUrl}/en${asPath === '/' ? '' : asPath}`
  };
  return (
    <>
      <Head>
        <title>{finalTitle}</title>
        <meta name="description" content={finalDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Manuel Sierra" />
        <meta name="keywords" content="GitHub trending, business ideas, AI analysis, repository analytics, startup ideas, programming trends, developer tools, newsletter" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Hreflangs */}
        <link rel="alternate" hrefLang="es" href={hreflangs.es} />
        <link rel="alternate" hrefLang="en" href={hreflangs.en} />
        <link rel="alternate" hrefLang="x-default" href={hreflangs.es} />
        
        {/* Open Graph */}
        <meta property="og:title" content={finalTitle} />
        <meta property="og:description" content={finalDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_BASE_URL}/reporadar_logo.png`} />
        <meta property="og:image:width" content="400" />
        <meta property="og:image:height" content="400" />
        <meta property="og:site_name" content="Repo Radar" />
        <meta property="og:locale" content={locale === 'en' ? 'en_US' : 'es_ES'} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={finalTitle} />
        <meta name="twitter:description" content={finalDescription} />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_BASE_URL}/reporadar_logo.png`} />
        <meta name="twitter:creator" content="@manuelsierra" />
        <meta name="twitter:site" content="@reporadar" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Repo Radar",
              "description": finalDescription,
              "url": canonicalUrl,
              "author": {
                "@type": "Person",
                "name": "Manuel Sierra",
                "url": "https://www.linkedin.com/in/manuelsierraarroyo/"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Repo Radar",
                "logo": {
                  "@type": "ImageObject",
                  "url": `${process.env.NEXT_PUBLIC_BASE_URL}/reporadar_logo.png`
                }
              }
            })
          }}
        />
      </Head>
      
      <div className="min-h-screen bg-secondary">
        {/* Language Selector */}
        <div className="bg-secondary">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-end">
            <LanguageSelector />
          </div>
        </div>
        
        {children}
        
        <footer className="border-t-3 border-primary bg-secondary py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-primary font-semibold">
              {t.footerMadeBy}{' '}
              <a 
                href="https://www.linkedin.com/in/manuelsierraarroyo/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors underline"
              >
                Manuel Sierra
              </a>{' '}
              <span className="text-accent text-sm">❤️</span> {t.footerCommunity}
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}