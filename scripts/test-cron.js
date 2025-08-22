const axios = require('axios');

async function testCronEndpoint() {
  console.log('🧪 Testing Cron Endpoint...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  const cronSecret = process.env.CRON_SECRET || 'test-secret-for-development';
  
  console.log(`📍 Testing URL: ${baseUrl}/api/cron/daily`);
  console.log(`🔐 Using CRON_SECRET: ${cronSecret.substring(0, 10)}...`);
  
  try {
    const response = await axios.post(
      `${baseUrl}/api/cron/daily`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutes
      }
    );
    
    console.log('\n✅ Cron endpoint test successful!');
    console.log('📊 Response status:', response.status);
    console.log('📈 Analysis results:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Cron endpoint test failed!');
    
    if (error.response) {
      console.error('📛 Status:', error.response.status);
      console.error('📛 Error:', error.response.data);
    } else if (error.request) {
      console.error('📛 Network error - No response received');
      console.error('📛 Make sure the dev server is running (npm run dev)');
    } else {
      console.error('📛 Error:', error.message);
    }
  }
}

async function testDirectAnalysis() {
  console.log('\n🔄 Testing Direct Analysis Script...\n');
  
  try {
    const DailyAnalysis = require('./daily-analysis');
    const analysis = new DailyAnalysis();
    const result = await analysis.run();
    
    console.log('✅ Direct analysis successful!');
    console.log('📊 Results:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Direct analysis failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Repo Radar Cron Testing Suite\n');
  
  // Test 1: Direct script execution
  await testDirectAnalysis();
  
  // Test 2: API endpoint (only if dev server is running)
  if (process.argv.includes('--api')) {
    await testCronEndpoint();
  } else {
    console.log('\n💡 To test API endpoint, run: npm run test-cron -- --api');
    console.log('💡 Make sure dev server is running: npm run dev');
  }
  
  console.log('\n🏁 Cron testing completed!');
}

if (require.main === module) {
  main();
}

module.exports = { testCronEndpoint, testDirectAnalysis };