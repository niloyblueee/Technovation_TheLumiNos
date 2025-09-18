const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  console.log('🗄️  Setting up database...');

  try {
    // Connect to MySQL without specifying a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'technovation_luminos';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log('✅ Database created/verified');

    // Use the database
    await connection.query(`USE \`${dbName}\``);
    console.log('✅ Using database');

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(50) NOT NULL,
        lastName VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        campus_id VARCHAR(50) UNIQUE,
        role ENUM('citizen', 'admin') DEFAULT 'citizen',
        profileImage VARCHAR(255),
        googleId VARCHAR(100) UNIQUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create citizens table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS citizens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        address TEXT,
        phone_number VARCHAR(20),
        location_coordinates JSON,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Citizens table created');

    // Create admins table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        department VARCHAR(100),
        admin_level ENUM('super', 'regular') DEFAULT 'regular',
        permissions JSON,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Admins table created');

    // Insert sample admin user (password: admin123)
    const adminPassword = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.';
    await connection.execute(`
      INSERT IGNORE INTO users (firstName, lastName, email, password, campus_id, role) 
      VALUES ('Admin', 'User', 'admin@technovation.com', ?, 'ADMIN001', 'admin')
    `, [adminPassword]);
    console.log('✅ Sample admin user created (admin@technovation.com / admin123)');

    // Insert sample citizen user (password: citizen123)
    await connection.execute(`
      INSERT IGNORE INTO users (firstName, lastName, email, password, campus_id, role) 
      VALUES ('John', 'Doe', 'citizen@technovation.com', ?, 'CIT001', 'citizen')
    `, [adminPassword]);
    console.log('✅ Sample citizen user created (citizen@technovation.com / citizen123)');

    // Insert admin record for the sample admin
    await connection.execute(`
      INSERT IGNORE INTO admins (user_id, department, admin_level)
      SELECT id, 'Public Works', 'super' 
      FROM users WHERE email = 'admin@technovation.com'
    `);
    console.log('✅ Sample admin record created');

    // Insert citizen record for the sample citizen
    await connection.execute(`
      INSERT IGNORE INTO citizens (user_id, address, phone_number)
      SELECT id, '123 Main Street, City', '+1234567890' 
      FROM users WHERE email = 'citizen@technovation.com'
    `);
    console.log('✅ Sample citizen record created');

    await connection.end();
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Sample accounts:');
    console.log('   Admin: admin@technovation.com / admin123');
    console.log('   Citizen: citizen@technovation.com / citizen123');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
