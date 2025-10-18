// restore.js
// Simple restore script that reads a .sql dump and executes it on the target MySQL.
//
// Install:
//   npm install mysql2 dotenv yargs
//
// Usage:
//   npm run restore
//
// Env:
//   Same as backup (MYSQL_URL or MYSQL_HOST / MYSQL_USER / ...)
//


/*
# Step 1: Backup old Railway DB
npm run backup  <= DONE

# (This creates DB_BACKUP/mybackup.sql)

# Step 2: Delete old Railway service <= DONE

# Step 3: Create a new Railway MySQL service and update .env with new credentials

# Step 4: Restore data to new DB
npm run restore

*/



const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
const mysql = require('mysql2/promise');

function getConnFromEnv() {
  const mysqlUrl = process.env.MYSQL_URL || process.env.RAILWAY_MYSQL_URL || process.env.CLEARDB_DATABASE_URL;
  if (mysqlUrl) {
    const u = new URL(mysqlUrl);
    const user = decodeURIComponent(u.username || '');
    const password = decodeURIComponent(u.password || '');
    const host = u.hostname;
    const port = u.port ? Number(u.port) : 3306;
    const db = u.pathname ? u.pathname.replace(/^\//, '') : '';
    return { host, port, user, password, db };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    db: process.env.DB_NAME || '',
  };
}

async function restoreDump(connInfo, dumpFile) {
  if (!fs.existsSync(dumpFile)) throw new Error(`Dump file not found: ${dumpFile}`);
  const sql = fs.readFileSync(dumpFile, 'utf8');

  // connect WITHOUT specifying database to allow "CREATE DATABASE" / "USE db" in dump file
  const connection = await mysql.createConnection({
    host: connInfo.host,
    port: connInfo.port,
    user: connInfo.user,
    password: connInfo.password,
    // allow execution of multiple statements
    multipleStatements: true,
    // increase timeout if needed
    connectTimeout: 10000,
  });

  try {
    console.log('Executing dump (may take some time)...');
    // execute all statements in one go; for large dumps you may want to stream
    await connection.query(sql);
    console.log('Restore completed.');
  } catch (err) {
    console.error('Restore error:', err.message || err);
    throw err;
  } finally {
    await connection.end();
  }
}

(async () => {
  const dumpFile = argv.file || argv.f;
  if (!dumpFile) {
    console.error('Usage: node restore.js --file=path/to/dump.sql');
    process.exit(2);
  }
  const conn = getConnFromEnv();
  console.log('Restoring to host:', conn.host, 'db (from dump or env):', conn.db || '(from dump)');
  try {
    await restoreDump(conn, dumpFile);
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
})();
