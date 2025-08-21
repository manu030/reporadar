const GitHubScraper = require('../lib/scraper');

async function testScraper() {
  console.log('🧪 Testing GitHub Scraper...\n');
  
  const scraper = new GitHubScraper();
  
  try {
    const repos = await scraper.getTrendingRepos(3);
    
    console.log('📊 Resultados del scraping:\n');
    
    repos.forEach((repo, index) => {
      console.log(`${index + 1}. ${repo.name}`);
      console.log(`   URL: ${repo.url}`);
      console.log(`   Descripción: ${repo.description.substring(0, 100)}...`);
      console.log(`   ⭐ ${repo.stars.toLocaleString()} stars`);
      console.log(`   💻 ${repo.language}`);
      console.log('');
    });
    
    console.log('✅ Scraper funcionando correctamente');
    
  } catch (error) {
    console.error('❌ Error en el scraper:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testScraper();
}

module.exports = testScraper;