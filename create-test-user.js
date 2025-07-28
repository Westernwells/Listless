#!/usr/bin/env node

// Quick script to create a verified test user for logout testing
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function createTestUser() {
  const email = 'logout-test-user@example.com';
  const password = 'TestPassword123!';
  const name = 'Logout Test User';

  console.log('Creating verified test user...');
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        email: email,
        password: password,
        email_confirm: true, // Skip email verification
        user_metadata: {
          name: name
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create test user:', error);
      return null;
    }

    const result = await response.json();
    console.log('✅ Created verified test user:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   User ID: ${result.user.id}`);
    
    return { email, password, name, id: result.user.id };
  } catch (error) {
    console.error('Error creating test user:', error);
    return null;
  }
}

createTestUser();
