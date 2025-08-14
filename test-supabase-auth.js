#!/usr/bin/env node

const https = require('https');

// Test both authentication and DNS resolution
const SUPABASE_URL = 'kdaiyodzdnphkiufagdu.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkYWl5b2R6ZG5waGtpdWZhZ2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTA5MjgsImV4cCI6MjA2NTQyNjkyOH0.QCfmwMl0W4kixvWRAQGrkuyN8_KMkUY5XJ4JwMVkHWM';

console.log('🔍 SUPABASE AUTHENTICATION TEST');
console.log('================================\n');

async function testSupabaseAuth() {
  console.log(`🌐 Testing: https://${SUPABASE_URL}`);
  console.log(`🔑 Using API Key: ${ANON_KEY.substring(0, 20)}...`);
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.request({
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'Listless-Auth-Test/1.0'
      }
    }, (res) => {
      const duration = Date.now() - startTime;
      console.log(`\n✅ CONNECTION SUCCESS (${duration}ms)`);
      console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`   Headers:`, JSON.stringify(res.headers, null, 2));
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Response: ${data.substring(0, 200)}...`);
        
        if (res.statusCode === 200) {
          console.log('\n🎉 SUPABASE API IS WORKING!');
          console.log('   → The issue is likely in your application configuration');
        } else if (res.statusCode === 401) {
          console.log('\n🔐 AUTHENTICATION ISSUE DETECTED!');
          console.log('   → API key may be expired or invalid');
          console.log('   → Check your Supabase dashboard for fresh keys');
        } else if (res.statusCode === 403) {
          console.log('\n🚫 ACCESS FORBIDDEN!');
          console.log('   → Project may be paused or suspended');
          console.log('   → Check billing and project status');
        } else {
          console.log(`\n⚠️  UNEXPECTED STATUS: ${res.statusCode}`);
        }
        
        resolve(true);
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`\n❌ CONNECTION FAILED (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      
      if (error.code === 'ENOTFOUND') {
        console.log('\n🔍 DNS RESOLUTION FAILED!');
        console.log('   → Project URL may have changed');
        console.log('   → Project may be deleted');
        console.log('   → Check Supabase dashboard');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('\n🚫 CONNECTION REFUSED!');
        console.log('   → Service may be down');
        console.log('   → Project may be suspended');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('\n⏰ CONNECTION TIMEOUT!');
        console.log('   → Network or firewall issue');
        console.log('   → Service may be overloaded');
      }
      
      resolve(false);
    });

    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      console.log(`\n⏰ REQUEST TIMEOUT (${duration}ms)`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function checkJWTToken() {
  console.log('\n🔍 JWT TOKEN ANALYSIS');
  console.log('=====================');
  
  try {
    // Decode JWT payload (base64)
    const parts = ANON_KEY.split('.');
    if (parts.length !== 3) {
      console.log('❌ Invalid JWT format');
      return;
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('📋 Token Payload:');
    console.log(`   Issuer: ${payload.iss}`);
    console.log(`   Role: ${payload.role}`);
    console.log(`   Project Ref: ${payload.ref}`);
    console.log(`   Issued At: ${new Date(payload.iat * 1000).toISOString()}`);
    console.log(`   Expires At: ${new Date(payload.exp * 1000).toISOString()}`);
    
    const now = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - now;
    
    if (timeUntilExpiry > 0) {
      const days = Math.floor(timeUntilExpiry / 86400);
      console.log(`   ✅ Token valid for ${days} more days`);
    } else {
      const daysExpired = Math.floor(-timeUntilExpiry / 86400);
      console.log(`   ❌ Token EXPIRED ${daysExpired} days ago!`);
    }
    
  } catch (error) {
    console.log(`❌ JWT decode error: ${error.message}`);
  }
}

// Run tests
async function runTests() {
  await checkJWTToken();
  await testSupabaseAuth();
  
  console.log('\n📋 NEXT STEPS:');
  console.log('==============');
  console.log('1. Check your Supabase dashboard at https://supabase.com');
  console.log('2. Verify project status (Active/Paused/Suspended)');
  console.log('3. Get fresh API keys if needed');
  console.log('4. Update .env.local with new credentials');
}

runTests().catch(console.error);
