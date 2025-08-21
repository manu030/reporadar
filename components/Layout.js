import Head from 'next/head';
import LanguageSelector from './LanguageSelector';
import useTranslations from '../hooks/useTranslations';

export default function Layout({ children, title = 'Reporadar', description = 'Daily GitHub trending analysis with AI-powered business ideas' }) {
  const t = useTranslations();
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Manuel Sierra" />
        <meta name="keywords" content="GitHub trending, business ideas, AI analysis, repository analytics, startup ideas, programming trends, developer tools, newsletter" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_BASE_URL} />
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_BASE_URL} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_BASE_URL}/reporadar_logo.png`} />
        <meta property="og:image:width" content="400" />
        <meta property="og:image:height" content="400" />
        <meta property="og:site_name" content="RepoRadar" />
        <meta property="og:locale" content="es_ES" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
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
              "name": "RepoRadar",
              "description": description,
              "url": process.env.NEXT_PUBLIC_BASE_URL,
              "author": {
                "@type": "Person",
                "name": "Manuel Sierra",
                "url": "https://www.linkedin.com/in/manuelsierraarroyo/"
              },
              "publisher": {
                "@type": "Organization",
                "name": "RepoRadar",
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