export default function Sitemap() {
  // This component will never render, it's just for Next.js dynamic routes
  return null;
}

export async function getServerSideProps({ res }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://reporadar.xyz';
  
  // Define static routes (excluding admin)
  const staticRoutes = [
    '',      // homepage ES
    '/en',   // homepage EN
  ];
  
  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticRoutes.map(route => {
    const url = `${baseUrl}${route}`;
    const isEnglish = route.startsWith('/en');
    
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
    <xhtml:link
      rel="alternate"
      hreflang="es"
      href="${baseUrl}${isEnglish ? route.replace('/en', '') : route}"/>
    <xhtml:link
      rel="alternate"
      hreflang="en" 
      href="${baseUrl}${isEnglish ? route : '/en' + route}"/>
    <xhtml:link
      rel="alternate"
      hreflang="x-default"
      href="${baseUrl}${isEnglish ? route.replace('/en', '') : route}"/>
  </url>`;
  }).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}