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
        national_id VARCHAR(20) UNIQUE,
        sex ENUM('male', 'female', 'other') NOT NULL,
        role ENUM('admin', 'govt_authority', 'citizen') DEFAULT 'citizen',
        status ENUM('active', 'pending', 'rejected') DEFAULT 'active',
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

    // Create government authorities table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS govt_authorities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        department VARCHAR(100) NOT NULL,
        region ENUM('dhaka_north', 'dhaka_south') NOT NULL,
        admin_level ENUM('super', 'regular') DEFAULT 'regular',
        permissions JSON,
        approved_by INT,
        approved_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Government Authorities table created');

    // Create admins table (fixed single admin)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        admin_level ENUM('super') DEFAULT 'super',
        permissions JSON,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Admins table created');

    //Create ISSUES tabble
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS issues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(20),
        coordinate VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        photo VARCHAR(255),
        emergency BOOLEAN DEFAULT FALSE,
        status ENUM('pending', 'in_progress', 'resolved', 'rejected') DEFAULT 'pending'
      )
    `);
    console.log('✅ Issues table created');

    // Insert fixed admin user (password: admin123)
    const adminPassword = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5K5K.';
    await connection.execute(`
      INSERT IGNORE INTO users (firstName, lastName, email, password, national_id, sex, role, status) 
      VALUES ('System', 'Admin', 'admin@technovation.com', ?, 'ADMIN001', 'male', 'admin', 'active')
    `, [adminPassword]);
    console.log('✅ Fixed admin user created (admin@technovation.com / admin123)');

    // Insert sample citizen user (password: citizen123)
    await connection.execute(`
      INSERT IGNORE INTO users (firstName, lastName, email, password, national_id, sex, role, status) 
      VALUES ('John', 'Doe', 'citizen@technovation.com', ?, '1234567890123', 'male', 'citizen', 'active')
    `, [adminPassword]);
    console.log('✅ Sample citizen user created (citizen@technovation.com / citizen123)');

    // Insert sample government authority (pending approval)
    await connection.execute(`
      INSERT IGNORE INTO users (firstName, lastName, email, password, national_id, sex, role, status) 
      VALUES ('Jane', 'Smith', 'govt@technovation.com', ?, '9876543210987', 'female', 'govt_authority', 'pending')
    `, [adminPassword]);
    console.log('✅ Sample government authority created (govt@technovation.com / govt123) - PENDING APPROVAL');

    // Insert admin record for the fixed admin
    await connection.execute(`
      INSERT IGNORE INTO admins (user_id, admin_level)
      SELECT id, 'super' 
      FROM users WHERE email = 'admin@technovation.com'
    `);
    console.log('✅ Fixed admin record created');

    // Insert citizen record for the sample citizen
    await connection.execute(`
      INSERT IGNORE INTO citizens (user_id, address, phone_number)
      SELECT id, '123 Main Street, Dhaka', '+8801234567890' 
      FROM users WHERE email = 'citizen@technovation.com'
    `);
    console.log('✅ Sample citizen record created');

    // Insert government authority record (pending approval)
    await connection.execute(`
      INSERT IGNORE INTO govt_authorities (user_id, department, region)
      SELECT id, 'Public Works', 'dhaka_north' 
      FROM users WHERE email = 'govt@technovation.com'
    `);
    console.log('✅ Sample government authority record created (pending approval)');

    await connection.end();
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Sample accounts:');
    console.log('   Admin: admin@technovation.com / admin123 (Fixed)');
    console.log('   Citizen: citizen@technovation.com / citizen123');
    console.log('   Govt Authority: govt@technovation.com / govt123 (Pending Approval)');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
