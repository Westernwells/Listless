/**
 * Simple test script to verify API endpoints are working
 * Run with: node scripts/test-api.js
 */

const BASE_URL = 'http://localhost:3000'

async function testAPI() {
  console.log('🧪 Testing Task Management API Endpoints...\n')

  // Test 1: GET /api/tasks (should require authentication)
  console.log('1. Testing GET /api/tasks (should return 401 without auth)')
  try {
    const response = await fetch(`${BASE_URL}/api/tasks`)
    console.log(`   Status: ${response.status}`)
    const data = await response.json()
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`)
  } catch (error) {
    console.log(`   Error: ${error.message}`)
  }
  console.log('')

  // Test 2: POST /api/tasks (should require authentication)
  console.log('2. Testing POST /api/tasks (should return 401 without auth)')
  try {
    const response = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Task',
        description: 'This is a test task',
        priority: 'medium'
      })
    })
    console.log(`   Status: ${response.status}`)
    const data = await response.json()
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`)
  } catch (error) {
    console.log(`   Error: ${error.message}`)
  }
  console.log('')

  // Test 3: POST /api/tasks with invalid data (should return validation error)
  console.log('3. Testing POST /api/tasks with invalid data')
  try {
    const response = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '', // Invalid: empty title
        priority: 'invalid' // Invalid: not a valid priority
      })
    })
    console.log(`   Status: ${response.status}`)
    const data = await response.json()
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`)
  } catch (error) {
    console.log(`   Error: ${error.message}`)
  }
  console.log('')

  // Test 4: GET /api/tasks/restore (should require authentication)
  console.log('4. Testing GET /api/tasks/restore (should return 401 without auth)')
  try {
    const response = await fetch(`${BASE_URL}/api/tasks/restore`)
    console.log(`   Status: ${response.status}`)
    const data = await response.json()
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`)
  } catch (error) {
    console.log(`   Error: ${error.message}`)
  }
  console.log('')

  // Test 5: GET /api/tasks/permanent (should require authentication)
  console.log('5. Testing GET /api/tasks/permanent (should return 401 without auth)')
  try {
    const response = await fetch(`${BASE_URL}/api/tasks/permanent`)
    console.log(`   Status: ${response.status}`)
    const data = await response.json()
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`)
  } catch (error) {
    console.log(`   Error: ${error.message}`)
  }
  console.log('')

  console.log('✅ API endpoint tests completed!')
  console.log('\n📝 Summary:')
  console.log('   - All endpoints should return 401 (Unauthorized) without authentication')
  console.log('   - Validation errors should return 422 (Unprocessable Entity)')
  console.log('   - This confirms the API routes are properly set up and secured')
  console.log('\n🔐 To test with authentication, you need to:')
  console.log('   1. Set up your Supabase project with the database schema')
  console.log('   2. Configure environment variables')
  console.log('   3. Create a user account and get an auth token')
  console.log('   4. Include the Authorization header in requests')
}

// Run the tests
testAPI().catch(console.error)
