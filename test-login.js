// Test Backend Login
// Run this with: node test-login.js

const email = 'mmm@gmail.com'
const password = 'YOUR_PASSWORD_HERE' // Replace with the password you used

console.log('Testing backend login...')
console.log('Email:', email)
console.log('Password:', password ? '***' : 'NOT SET')
console.log('')

fetch('http://localhost:3001/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password })
})
.then(async response => {
  console.log('Status:', response.status, response.statusText)
  const data = await response.json()
  console.log('Response:', JSON.stringify(data, null, 2))

  if (response.ok) {
    console.log('\n✅ LOGIN SUCCESSFUL!')
    console.log('Access Token:', data.access_token ? 'Present' : 'Missing')
    console.log('User:', data.user?.email)
  } else {
    console.log('\n❌ LOGIN FAILED!')
    console.log('Error:', data.message || data.error)
  }
})
.catch(error => {
  console.log('\n❌ REQUEST FAILED!')
  console.log('Error:', error.message)
  console.log('\nIs the backend running on port 3001?')
})
