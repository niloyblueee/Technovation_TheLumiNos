const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabase() {
    console.log('🗄️  Resetting database...');

    try {
        // Connect to MySQL without specifying a database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });

        console.log('✅ Connected to MySQL server');

        // Drop and recreate database
        const dbName = process.env.DB_NAME || 'technovation_luminos';
        await connection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
        console.log('✅ Database dropped');

        await connection.execute(`CREATE DATABASE \`${dbName}\``);
        console.log('✅ Database created');

        await connection.end();
        console.log('🎉 Database reset completed successfully!');

    } catch (error) {
        console.error('❌ Database reset failed:', error.message);
        process.exit(1);
    }
}

resetDatabase();

