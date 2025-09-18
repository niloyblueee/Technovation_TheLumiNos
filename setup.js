#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Technovation TheLumiNos...\n');

// Check if .env files exist
const frontendEnvPath = path.join(__dirname, '.env');
const backendEnvPath = path.join(__dirname, 'backend', '.env');

console.log('📋 Checking environment files...');

if (!fs.existsSync(frontendEnvPath)) {
    console.log('⚠️  Frontend .env file not found. Please create it from env.example');
    console.log('   Copy env.example to .env and update the values');
} else {
    console.log('✅ Frontend .env file exists');
}

if (!fs.existsSync(backendEnvPath)) {
    console.log('⚠️  Backend .env file not found. Please create it from backend/env.example');
    console.log('   Copy backend/env.example to backend/.env and update the values');
} else {
    console.log('✅ Backend .env file exists');
}

console.log('\n📦 Installing dependencies...');

// Check if node_modules exist
const frontendNodeModules = path.join(__dirname, 'node_modules');
const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');

if (!fs.existsSync(frontendNodeModules)) {
    console.log('⚠️  Frontend dependencies not installed. Run: npm install');
} else {
    console.log('✅ Frontend dependencies installed');
}

if (!fs.existsSync(backendNodeModules)) {
    console.log('⚠️  Backend dependencies not installed. Run: cd backend && npm install');
} else {
    console.log('✅ Backend dependencies installed');
}

console.log('\n🗄️  Database setup:');
console.log('   1. Make sure MySQL is running');
console.log('   2. Run: mysql -u root -p < backend/schema.sql');
console.log('   3. Update database credentials in backend/.env');

console.log('\n🔑 Google OAuth setup:');
console.log('   1. Go to Google Cloud Console');
console.log('   2. Create OAuth 2.0 credentials');
console.log('   3. Add authorized origins: http://localhost:5173');
console.log('   4. Update GOOGLE_CLIENT_ID in both .env files');

console.log('\n🚀 To start the application:');
console.log('   Frontend: npm run dev');
console.log('   Backend:  cd backend && npm run dev');

console.log('\n📚 For more information, see README.md');
console.log('\n✨ Setup complete! Happy coding!');
