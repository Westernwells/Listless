#!/usr/bin/env node

const https = require('https');
const dns = require('dns');
const { promisify } = require('util');

const lookup = promisify(dns.lookup);

// Supabase instances to test
const SUPABASE_INSTANCES = {
  production: 'kdaiyodzdnphkiufagdu.supabase.co',
  test: 'rxdwcvzxgzwuapdxxbnt.supabase.co'
};

console.log('🔍 SUPABASE CONNECTIVITY DIAGNOSTIC');
console.log('=====================================\n');

async function testDNSResolution(hostname) {
  console.log(`🌐 Testing DNS resolution for: ${hostname}`);
  try {
    const result = await lookup(hostname);
    console.log(`✅ DNS Resolution SUCCESS: ${result.address} (${result.family === 4 ? 'IPv4' : 'IPv6'})`);
    return true;
  } catch (error) {
    console.log(`❌ DNS Resolution FAILED: ${error.message}`);
    return false;
  }
}

async function testHTTPSConnection(hostname) {
  console.log(`🔗 Testing HTTPS connection to: ${hostname}`);
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.request({
      hostname: hostname,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Listless-Network-Diagnostic/1.0'
      }
    }, (res) => {
      const duration = Date.now() - startTime;
      console.log(`✅ HTTPS Connection SUCCESS: Status ${res.statusCode} (${duration}ms)`);
      console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
      resolve(true);
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`❌ HTTPS Connection FAILED: ${error.message} (${duration}ms)`);
      console.log(`   Error Code: ${error.code}`);
      resolve(false);
    });

    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      console.log(`⏰ HTTPS Connection TIMEOUT (${duration}ms)`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testSupabaseAPI(hostname) {
  console.log(`🔧 Testing Supabase API endpoint: ${hostname}`);
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.request({
      hostname: hostname,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      timeout: 15000,
      headers: {
        'User-Agent': 'Listless-Supabase-Test/1.0',
        'Accept': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      }
    }, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Supabase API SUCCESS: Status ${res.statusCode} (${duration}ms)`);
        if (res.statusCode === 200) {
          console.log(`   API Response: ${data.substring(0, 200)}...`);
        }
        resolve(true);
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`❌ Supabase API FAILED: ${error.message} (${duration}ms)`);
      console.log(`   Error Code: ${error.code}`);
      resolve(false);
    });

    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      console.log(`⏰ Supabase API TIMEOUT (${duration}ms)`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function runDiagnostics() {
  console.log(`⏰ Starting diagnostics at: ${new Date().toISOString()}\n`);
  
  const results = {};
  
  for (const [name, hostname] of Object.entries(SUPABASE_INSTANCES)) {
    console.log(`\n🏷️  TESTING ${name.toUpperCase()} INSTANCE: ${hostname}`);
    console.log('─'.repeat(60));
    
    results[name] = {
      hostname,
      dns: await testDNSResolution(hostname),
      https: false,
      api: false
    };
    
    if (results[name].dns) {
      results[name].https = await testHTTPSConnection(hostname);
      
      if (results[name].https) {
        results[name].api = await testSupabaseAPI(hostname);
      }
    }
    
    console.log(`\n📊 ${name.toUpperCase()} SUMMARY:`);
    console.log(`   DNS: ${results[name].dns ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   HTTPS: ${results[name].https ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   API: ${results[name].api ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  console.log('\n🎯 FINAL RECOMMENDATIONS:');
  console.log('═'.repeat(60));
  
  const workingInstance = Object.entries(results).find(([name, result]) => 
    result.dns && result.https && result.api
  );
  
  if (workingInstance) {
    const [name, result] = workingInstance;
    console.log(`✅ RECOMMENDED: Use ${name.toUpperCase()} instance (${result.hostname})`);
    
    if (name === 'test') {
      console.log('\n🔧 IMMEDIATE ACTION: Update .env.local with test environment:');
      console.log('NEXT_PUBLIC_SUPABASE_URL=https://rxdwcvzxgzwuapdxxbnt.supabase.co');
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');
    }
  } else {
    console.log('❌ CRITICAL: No working Supabase instances found!');
    console.log('   Check network connectivity, firewall, or VPN settings');
    console.log('   Consider using local Supabase: npx supabase start');
  }
  
  console.log(`\n⏰ Diagnostics completed at: ${new Date().toISOString()}`);
}

// Run diagnostics
runDiagnostics().catch(console.error);
